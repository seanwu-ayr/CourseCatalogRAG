
from langchain_core.output_parsers import StrOutputParser
from channels.generic.websocket import AsyncWebsocketConsumer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import json
import tempfile
from dotenv import load_dotenv, find_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.indexes import VectorstoreIndexCreator
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_openai import OpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers import ContextualCompressionRetriever
from langchain_core.runnables import RunnableParallel
from langchain_core.runnables import ConfigurableFieldSpec
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.retrievers import ParentDocumentRetriever, SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.storage import InMemoryStore
from langchain.retrievers import ParentDocumentRetriever
from langchain_core.chat_history import BaseChatMessageHistory
from langchain.callbacks.base import AsyncCallbackHandler
from langchain_pinecone import PineconeVectorStore
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer, util
from operator import itemgetter
import torch
import numpy as np
import requests
import logging
import pandas as pd
import re

from typing import List
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
import transformers as tr
import uuid

from pinecone import Pinecone
from pinecone import ServerlessSpec
import time

load_dotenv(find_dotenv())

LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
os.environ["LANGCHAIN_TRACING_V2"] = "true"
# os.environ["BERT_PATH"] = ''
os.environ['USER_AGENT'] = 'myagent'

# "..\prompt_classifier\BERT_tuned\content\model_out\checkpoint-348"


class Category(BaseModel):
    id: int = Field(description="numerical value of prompt category")
    description: str = Field(description="description of prompt category")
    
class CustomCallbackHandler(AsyncCallbackHandler):
    def __init__(self, socket):
        self.socket = socket

    async def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs) -> None:
        self.run_id = uuid.uuid4()
        await self.socket.send(text_data=json.dumps({
            "event": "start",
            "id": self.run_id.int,
            "chunk": ''
        }))

    async def on_llm_new_token(self, token: str, **kwargs) -> any:
        await self.socket.send(text_data=json.dumps({
            "event": "stream",
            "id": self.run_id.int,
            "chunk": token
        }))


def fetch_history(session_id: str, hist: dict) -> BaseChatMessageHistory:
    if session_id not in hist:
        hist[session_id] = ChatMessageHistory()
        print("INITIALIZING MESSAGE HISTORY")
    else:
        print("\nMESSAGE HISTORY: ", hist[session_id].messages, "\n")
    return hist[session_id]

def wrapHistory(messages):
    history = ChatMessageHistory()
    wrappedMessages = []
    for message in messages:
        if message["type"] == 'human':
            wrappedMessages.append(HumanMessage(content=message["content"]))
        elif message["type"] == 'ai':
            wrappedMessages.append(AIMessage(content=message["content"]))

    history.add_messages(wrappedMessages)
    return history

def unwrapHistory(history):
    messages = history["abc123"].messages
    unwrappedMessages = []
    for message in messages:
        unwrappedMessages.append(
            {'content': message.content, 'type': 'human'} if message.type == 'human' else
            {'content': message.content, 'type': 'ai'}
        )
    return unwrappedMessages

def get_document_chain(socket):
    # Set up Pinecone vectorstore
    index_name = "course-catalog-scu"
    index_dimension = 3072
    index_namespace = "scu"
    cloud = os.environ.get('PINECONE_CLOUD') or 'aws'
    region = os.environ.get('PINECONE_REGION') or 'us-east-1'

    # Initialize Pinecone with the API key
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))

    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=index_dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=cloud,
                region=region
            )
        )

    while not pc.describe_index(index_name).status["ready"]:
        time.sleep(1)

    # Initialize the index
    index = pc.Index(index_name)

    # Fetch document from Pinecone to verify
    response = index.fetch(ids=["132b1c85-feef-44ea-a5b8-d6c178943c4"])
    print(response)
    if not response["vectors"]:
        print("record not exist")

    # Use OpenAI embeddings for embedding the documents
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    # Embed each chunk and upsert the embeddings into your Pinecone index
    vectorstore = PineconeVectorStore(index=index, embedding=embeddings, namespace=index_namespace)

    # Define a retriever for metadata-based search using the new logic
    def advanced_self_query_retriever(vectorstore, top_k=10):
        metadata_field_info = [
            AttributeInfo(
                name="courseListing",
                description="The public listing of the course (e.g., 'ACTG 11A'), used in the course catalog and by students during registration.",
                type="string",
            ),
            AttributeInfo(
                name="title",
                description="The official title of the course (e.g., 'intermediate financial accounting ii', 'business law for accountants'), used in the course catalog and on transcripts.",
                type="string",
            ),
            AttributeInfo(
                name="academicUnits",
                description="A list of academic departments or units responsible for the course (e.g., 'Accounting Department', 'Business Law Department', 'Computer Science Department').",
                type="list[string]",
            ),
            AttributeInfo(
                name="schools",
                description="The school(s) under which the course is offered (e.g., 'Leavey School of Business', 'School of Engineering', 'School of Arts and Sciences').",
                type="list[string]",
            ),
            AttributeInfo(
                name="courseSubjects",
                description="The subjects or topics covered by the course (e.g., 'Accounting', 'Business Law', 'Computer Science').",
                type="list[string]",
            ),
            AttributeInfo(
                name="academicLevel",
                description="The academic level of the course, such as 'Undergraduate' or 'Graduate'.",
                type="string",
            ),
            AttributeInfo(
                name="prerequisiteCourses",
                description="A list of prerequisite courses that must be completed before enrolling in this course.",
                type="list[string]",
            ),
            AttributeInfo(
                name="corequisiteCourses",
                description="A list of courses that must be taken concurrently with this course, if applicable.",
                type="list[string]",
            ),
            AttributeInfo(
                name="specialTopics",
                description="Any special topics covered in the course that go beyond the standard curriculum.",
                type="list[string]",
            ),
            AttributeInfo(
                name="publicNotes",
                description="Publicly available notes or comments about the course (e.g., specific enrollment restrictions or offerings).",
                type="Optional[string]",
            ),
            AttributeInfo(
                name="description",
                description="A detailed description of the course, including content, learning objectives, and any enrollment restrictions or prerequisites.",
                type="string",
            ),
            AttributeInfo(
                name="minimumUnits",
                description="The minimum number of units a student can earn by completing this course.",
                type="int",
            ),
            AttributeInfo(
                name="maximumUnits",
                description="The maximum number of units a student can earn by completing this course.",
                type="int",
            ),
            AttributeInfo(
                name="courseStatus",
                description="The current status of the course in the university system (e.g., 'Approved', 'Pending', 'Retired').",
                type="string",
            ),
        ]

        document_content_description = "chunks from a university database"
        llm = ChatOpenAI(model_name='gpt-4', temperature=0)

        # Use SelfQueryRetriever for metadata-based search
        meta_retriever = SelfQueryRetriever.from_llm(
            llm,
            vectorstore,  # Vector store to perform search
            document_content_description,
            metadata_field_info,
            verbose=True,
            search_kwargs={"k": top_k}
        )
        return meta_retriever

    retriever = advanced_self_query_retriever(vectorstore, top_k=10)

    # Set up the history-aware retriever logic
    context_model = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    compressor = LLMChainExtractor.from_llm(context_model)

    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor, base_retriever=retriever
    )

    context_system_prompt = """Given a chat history and the latest user question \
    which might reference context in the chat history, formulate a standalone question \
    which can be understood without the chat history. Do NOT answer the question, \
    just reformulate it if needed and otherwise return it as is."""

    context_prompt = ChatPromptTemplate.from_messages([
        ("system", context_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    history_aware_retriever = create_history_aware_retriever(
        context_model, compression_retriever, context_prompt
    )

    qa_system_prompt = """
    Answer the question as detailed as possible from the provided context, \
    make sure to provide all the details, if the answer is not in provided \
    context just say, "answer is not available in the context", \
    don't provide the wrong answer. It's also crucial that you \
    list any sources used at the end of your response.

    Context: {context}

    Your Answer:

    Source: 
    """
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    doc_prompt_template = """
    Document Content: {page_content}

    Source: {source}
    """
    doc_prompt = PromptTemplate(template=doc_prompt_template, input_variables=["page_content", "source"])

    output_model = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, streaming=True, callbacks=[CustomCallbackHandler(socket=socket)])
    qa_chain = create_stuff_documents_chain(output_model, qa_prompt, document_prompt=doc_prompt)

    rag_chain = create_retrieval_chain(history_aware_retriever, qa_chain)

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        fetch_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
        history_factory_config=[
            ConfigurableFieldSpec(
                id="session_id",
                annotation=str,
                name="Session ID",
                description="Unique identifier for the session.",
                default="abc123",
                is_shared=True,
            ),
            ConfigurableFieldSpec(
                id="hist",
                annotation=dict,
                name="History",
                description="Dictionary containing chat history.",
                default={},
                is_shared=True,
            )]
    )
    
    return conversational_rag_chain


def select_chain(user_question, socket):
    category = 3  # Simplified category selection for now

    match category:
        case 0:
            chain = get_conversational_chain()

        case 1 | 2 | 3:  
            chain = get_document_chain(socket=socket)

        case 4:
            chain = get_conversational_chain()

        case _:
            print("default")

    return (chain, category)


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        user_input = text_data_json["user_input"]
        history = text_data_json["history"]

        chain, category = select_chain(user_input, socket=self)

        history_dict = {
            "abc123": wrapHistory(history)
        }

        response = await chain.ainvoke(
            {'input': user_input},
            config={"configurable": {"session_id": "abc123", "hist": history_dict}},
        )

        print(response)

        # Send the final response back to the client
        await self.send(text_data=json.dumps({"answer": response["answer"]}))

        # Optionally unwrap history and send back if needed
        await self.send(text_data=json.dumps(unwrapHistory(history_dict)))
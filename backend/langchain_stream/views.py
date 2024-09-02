
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
from langchain_core.chat_history import BaseChatMessageHistory
from langchain.callbacks.base import AsyncCallbackHandler
from langchain_pinecone import PineconeVectorStore

from typing import List
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
import transformers as tr
import uuid
from typing import Optional

from pinecone import Pinecone
from pinecone import ServerlessSpec
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(find_dotenv())

LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
USER_AGENT = os.getenv("USER_AGENT")

os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
os.environ["LANGCHAIN_TRACING_V2"] = "true"
# os.environ["BERT_PATH"] = ''

# "..\prompt_classifier\BERT_tuned\content\model_out\checkpoint-348"


class Category(BaseModel):
    id: int = Field(description="numerical value of prompt category")
    description: str = Field(description="description of prompt category")
    
class CustomCallbackHandler(AsyncCallbackHandler):
    def __init__(self, client_id: str):
        self.client_id = client_id

    async def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs) -> None:
        self.run_id = uuid.uuid4()
        await connection_manager.send(self.client_id, json.dumps({
            "event": "start",
            "id": self.run_id.hex,
            "chunk": ''
        }))

    async def on_llm_new_token(self, token: str, **kwargs) -> any:
        await connection_manager.send(self.client_id, json.dumps({
            "event": "stream",
            "id": self.run_id.hex,
            "chunk": token
        }))
       

def fetch_history(session_id: str, hist: dict) -> BaseChatMessageHistory:

    if session_id not in hist:  
        hist[session_id] = ChatMessageHistory()
        print("INITIALIZING MESSAGE HISTORY")
    else: print("\nMESSAGE HISTORY: ", hist[session_id].messages, "\n")
    return hist[session_id]



def get_document_chain(client_id: str):

    # print("\n\nSESSION HISTORY STORE:", hist, "\n\n")

    context_model = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    output_model = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, streaming=True, callbacks=[CustomCallbackHandler(client_id=client_id)])

    #Set up pinecone db retriever

    index_name = "course-catalog-scu"
    index_dimension = 3072
    index_namespace = "scu"
    cloud = os.environ.get('PINECONE_CLOUD') or 'aws'
    region = os.environ.get('PINECONE_REGION') or 'us-east-1'

    pc = Pinecone(api_key=PINECONE_API_KEY)

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

    index = pc.Index(index_name)
    response = index.fetch(ids=["132b1c85-feef-44ea-a5b8-d6c178943c4"])

    if not response["vectors"]:
        print("record does not exist")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    # Embed each chunk and upsert the embeddings into your Pinecone index.
    vectorstore = PineconeVectorStore(index=index, embedding=embeddings, namespace=index_namespace)



    # embeddings = OpenAIEmbeddings()
    # faiss_path = r"C:\Users\Aiden\OneDrive\Documents\GitHub\CourseCatalogRAG\backend\faiss_index"
    # new_db = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)

    retriever =  vectorstore.as_retriever(
        search_kwargs={"k": 10}
    )
    llm = OpenAI(temperature=0)
    compressor = LLMChainExtractor.from_llm(llm)

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

    # It's also crucial that you \
    # list any sources used at the end of your response.

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
    # prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"]) 
      
    doc_prompt_template = """
    Document Content: {page_content}

    Source: {source}
    """
    doc_prompt = PromptTemplate(template=doc_prompt_template, input_variables=["page_content", "source"])

    qa_chain = create_stuff_documents_chain(output_model, qa_prompt, document_prompt=doc_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, qa_chain)
    # chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    

    conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    fetch_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer",
    history_factory_config= [
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

def get_conversational_chain():

    prompt_template = """
    You are a friendly, supportive AI Advisory bot for students at Santa Clara University. 
    Respond to students' communication enthusiastically and supportively. Do not provide misinformation
    or answer questions you are unsure of.\n\n
    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)


    prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt).with_config({"name": "ai"})

    return chain


def select_chain(user_question, client_id: str):

    # classifier = tr.pipeline(task="text-classification", model=os.environ["BERT_PATH"])

    embeddings = OpenAIEmbeddings()

    # category = classifier(user_question)

    # labels = {0: "Phatic Communication",
    #           1: "General Advice",
    #           2: "Dates/Times",
    #           3: "Specific Course Info",
    #           4: "Miscellanious"
    #         }
    # category = int(category[0]['label'])
    
    # print(category, labels[category])

    category = 3

    match category:
        case 0:
            chain = get_conversational_chain()
            # docs = {}
            # response = chain.invoke(
            # {"question": user_question, "input_documents":docs}
            # , return_only_outputs=True
            # )

            # output = response["output_text"]

        case 1:
            chain = get_document_chain(client_id=client_id)
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")

            # print(response)
            
            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 2:
            chain = get_document_chain(client_id=client_id)
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")
            
            # print(response)

            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 3:
            chain = get_document_chain(client_id=client_id)
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")
            
            # print(response)
            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 4:
            chain = get_conversational_chain()
            # chain = """Sorry, your input prompt is outside the scope of my capabilities. Pleast contact the Drahman Center for further help:
            # https://www.scu.edu/drahmann/"""

        case _:
            print("default")

    # Log the question and answer
    # with open("conversation_log.txt", "a") as log_file:
    #     log_file.write(f"Question: {user_question}\nAnswer: {output}")

    return (chain, category)

# os.environ["LANGCHAIN_TRACING_V2"] = "true"
# os.environ["LANGCHAIN_API_KEY"] = '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'
# os.environ["OPENAI_API_KEY"] = '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'
# os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
# os.environ["BERT_PATH"] = "prompt_classifier\BERT_tuned\content\model_out\checkpoint-348"


# prompt = ChatPromptTemplate.from_messages([
#     ("system", "You are a helpful assistant for students of Santa Clara University. Answer questions and provide links to resources."),
#     ("user", "{input}")
# ])

# llm = ChatOpenAI(model="gpt-4o-mini")

# output_parser = StrOutputParser()
# Chain

# chain = prompt | llm.with_config({"run_name": "model"}) | output_parser.with_config({"run_name": "Assistant"})


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

def unwrapHistory(history, client_id):
    messages = history[client_id].messages
    unwrappedMessages = []
    for message in messages:
            # print(message)
            unwrappedMessages.append(
                {'content':message.content, 'type':'human'} if message.type == 'human' else
                {'content':message.content, 'type':'ai'}
            )

    return unwrappedMessages


# class ChatConsumer(AsyncWebsocketConsumer):

#     async def connect(self):
#         await self.accept()

#     async def disconnect(self, close_code):
#         pass

#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         user_input = text_data_json["user_input"]
#         history = text_data_json["history"]

#         # try:

#         chain, category = select_chain(user_input, socket=self)


#         history_dict = {
#             "abc123": wrapHistory(history)
#         }

#         # response = chain.invoke(
#         #     {'input': user_input},
#         #     config={"configurable": {"session_id": "abc123", "hist": history_dict}},
#         # )

#         # print(response)

#         # Stream the response

#         # async for chunk in chain.astream_events(
#         #     {'input': user_input},
#         #     config={"configurable": {"session_id": "abc123", "hist": history_dict}},
#         #     version="v2",
#         #     include_names=["ai"]
#         # ):

#         response = await chain.ainvoke(
#             {'input': user_input},
#             config={"configurable": {"session_id": "abc123", "hist": history_dict}},
#         )

#         print(response)

#         # await self.send(text_data=json.dumps({"answer": response["answer"]}))

#             # if chunk["event"] in ["on_chain_start", "on_chain_stream"]:
#             #     print(chunk)
#                 # await self.send(text_data=json.dumps(chunk))``

#             # if chunk["event"] in ["on_parser_end"]:
#             #     await self.send(text_data=json.dumps(unwrapHistory(history_dict)))

#         # except Exception as e:
#         #     print(e)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        # self.socket = WebSocket()

    async def connect(self, client_id: str, websocket: WebSocket):
        print(f'attempting to connect to client {client_id}')
        await websocket.accept()
        print('connection successful')
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id):
        self.active_connections.pop(client_id, None)

    async def send(self, client_id: str, msg_data):
        client_socket = self.active_connections.get(client_id)
        if client_socket:
            await client_socket.send_text(msg_data)
        else:
            print(f"socket ({client_id}) not found")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connection_manager = ConnectionManager()

@app.websocket("/ws/socket/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    # , client_id: Optional[str] = Query(None)
    await connection_manager.connect(client_id, websocket)

    # await websocket.accept()
    try:
        while True:
            
            # data = await websocket.receive_text()
            # print(f"Received data: {data}")
            # await websocket.send_text(f"Received: {data}")

            msg_data = await websocket.receive()
            if msg_data:
                msg_data_json = json.loads(msg_data['text'])
                event = msg_data_json["event"] 

                if event == 'ping':
                    await websocket.send_json({"event": "pong"})
                else:
                           
                    user_input = msg_data_json["user_input"]
                    history = msg_data_json["history"]

                    chain, category = select_chain(user_input, client_id=client_id)

                    history_dict = {
                        client_id: wrapHistory(history)
                    }

                    response = await chain.ainvoke(
                        {'input': user_input},
                        config={"configurable": {"session_id": client_id, "hist": history_dict}},
                    )

                print(response)

    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        # print("socket disconnected")
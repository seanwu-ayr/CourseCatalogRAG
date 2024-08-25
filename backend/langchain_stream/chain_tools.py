from langchain_core.output_parsers import StrOutputParser
from channels.generic.websocket import AsyncWebsocketConsumer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import json
import tempfile
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.indexes import VectorstoreIndexCreator
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain.retrievers import ContextualCompressionRetriever
from langchain_core.runnables import RunnableParallel
from langchain_core.runnables import ConfigurableFieldSpec
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import HumanMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

from typing import List
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
import transformers as tr


load_dotenv('.env')

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = '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'
os.environ["OPENAI_API_KEY"] = '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'
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
os.environ["BERT_PATH"] = "prompt_classifier\BERT_tuned\content\model_out\checkpoint-348"



class Category(BaseModel):
    id: int = Field(description="numerical value of prompt category")
    description: str = Field(description="description of prompt category")

def fetch_history(session_id: str, hist: dict) -> BaseChatMessageHistory:

    if session_id not in hist:  
        hist[session_id] = ChatMessageHistory()
        print("INITIALIZING MESSAGE HISTORY")
    else: print("\nMESSAGE HISTORY: ", hist[session_id].messages, "\n")
    return hist[session_id]

def get_document_chain():

    # print("\n\nSESSION HISTORY STORE:", hist, "\n\n")

    model = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    embeddings = OpenAIEmbeddings()
    new_db = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
    retriever =  new_db.as_retriever()

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
        model, retriever, context_prompt
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

    qa_chain = create_stuff_documents_chain(model, qa_prompt, document_prompt=doc_prompt)
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
            default="",
            is_shared=True,
        )]
)

    return (conversational_rag_chain)

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
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain


def select_chain(user_question):

    classifier = tr.pipeline(task="text-classification", model=os.environ["BERT_PATH"])

    embeddings = OpenAIEmbeddings()

    category = classifier(user_question)

    labels = {0: "Phatic Communication",
              1: "General Advice",
              2: "Dates/Times",
              3: "Specific Course Info",
              4: "Miscellanious"
            }
    category = int(category[0]['label'])
    
    print(category, labels[category])
    
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
            chain = get_document_chain()
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")

            # print(response)
            
            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 2:
            chain = get_document_chain()
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")
            
            # print(response)

            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 3:
            chain = get_document_chain()
     
            # response = chain.invoke(
            #     {"input": user_question}, 
            #     config={"configurable": {"session_id": "abc123", "hist": hist}}
            #     )
                # print(temp_r, "\n\n\n")
            
            # print(response)
            # output = response["answer"]

            # print(hist, hist["abc123"].messages)

        case 4:
            chain = """Sorry, your input prompt is outside the scope of my capabilities. Pleast contact the Drahman Center for further help:
            https://www.scu.edu/drahmann/"""

        case _:
            print("default")

    # Log the question and answer
    # with open("conversation_log.txt", "a") as log_file:
    #     log_file.write(f"Question: {user_question}\nAnswer: {output}")

    return (chain, category)
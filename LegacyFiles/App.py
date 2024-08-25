import streamlit as st
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import json
import tempfile
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

from dotenv import load_dotenv

load_dotenv()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = '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'
os.environ["OPENAI_API_KEY"] = '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'
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
os.environ["BERT_PATH"] = "prompt_classifier\BERT_tuned\content\model_out\checkpoint-348"

# def read_pdf_from_path(path):
#     if os.path.isdir(path):  # If the path is a directory
#         pdf_files = [f for f in os.listdir(path) if f.endswith('.pdf')]
#         pdf_docs = [os.path.join(path, f) for f in pdf_files]
#     elif os.path.isfile(path) and path.endswith('.pdf'):  # If the path is a single PDF file
#         pdf_docs = [path]  # Wrap the single file path in a list
#     else:
#         raise ValueError("Provided path is neither a directory containing PDFs nor a PDF file.")
#     return get_pdf_text(pdf_docs)


def get_pdf_text(pdf_sources):
    text = ""
    for source in pdf_sources:
        # If the source is a file path, open it as a PDF file
        if isinstance(source, str) and os.path.isfile(source):
            pdf_reader = PdfReader(source)
        # If the source is an uploaded file, it's already a file-like object
        elif hasattr(source, "read"):  # Checking if source is a file-like object
            pdf_reader = PdfReader(source)
        else:
            continue  # If neither, skip to the next source
        
        for page in pdf_reader.pages:
            text += page.extract_text() or ""  # Using 'or ""' to avoid appending None if extract_text() fails
    return text

def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(text)
    return chunks

def get_web_docs(web_url):
    loader = WebBaseLoader(web_url)
    docs = loader.load()
    return docs

def get_csv_docs(csv_docs):
    for csv in csv_docs:
        temp_dir = tempfile.mkdtemp()
        path = os.path.join(temp_dir, csv.name)
        with open(path, "wb") as f:
                f.write(csv.getvalue())
        loader = CSVLoader(file_path=path)
        docs = loader.load()
    return docs

def get_vector_store_from_text(text_chunks):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local("faiss_index")
    
def get_vector_store_from_docs(documents):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_documents(documents, embedding=embeddings)
    vector_store.save_local("faiss_index")

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

    model = ChatOpenAI(model_name="gpt-4", temperature=0.2)
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

    model = ChatOpenAI(model_name="gpt-4", temperature=0.3)


    prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain



def user_input(user_question, hist):

    # chat_history = []

    # with open("chat_history.json", 'r') as f:
    #     chat_data = json.load(f)["history"]
    
    # for chat in chat_data:
    #     chat_history.append(chat[0])

    
    # print(len(chat_history), chat_history)
    # chain0 = get_LLM_chain()


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
    
        # response = chain0.invoke(
        #     {"question": user_question, "input_documents": {}}
        #     , return_only_outputs=True
        # )

        
        # category = json.loads(response["output_text"])["category"]
        # print(category)
        # category = int(category[0]) if type(category) == str else category
        # print(category)

    match category:
        case 0:
            chain = get_conversational_chain()
            docs = {}
            response = chain.invoke(
            {"question": user_question, "input_documents":docs}
            , return_only_outputs=True
            )

            output = response["output_text"]

        case 1:
            chain = get_document_chain()
     
            response = chain.invoke(
                {"input": user_question}, 
                config={"configurable": {"session_id": "abc123", "hist": hist}}
                )
                # print(temp_r, "\n\n\n")

            print(response)
            
            output = response["answer"]

            print(hist, hist["abc123"].messages)

        case 2:
            chain = get_document_chain()
     
            response = chain.invoke(
                {"input": user_question}, 
                config={"configurable": {"session_id": "abc123", "hist": hist}}
                )
                # print(temp_r, "\n\n\n")
            
            print(response)

            output = response["answer"]

            print(hist, hist["abc123"].messages)

        case 3:
            chain = get_document_chain()
     
            response = chain.invoke(
                {"input": user_question}, 
                config={"configurable": {"session_id": "abc123", "hist": hist}}
                )
                # print(temp_r, "\n\n\n")
            
            print(response)
            output = response["answer"]

            print(hist, hist["abc123"].messages)

        case 4:
            output = """Sorry, your input prompt is outside the scope of my capabilities. Pleast contact the Drahman Center for further help:
            https://www.scu.edu/drahmann/"""

        case _:
            print("default")

    # Log the question and answer
    with open("conversation_log.txt", "a") as log_file:
        log_file.write(f"Question: {user_question}\nAnswer: {output}")
    st.session_state.conversation.append(f"Reply: {output}")  # Append the answer to the conversation history

    return hist

def main():

    st.set_page_config("Chat PDF")
    st.header("Santa Clara Course Catalog LLM")

    if 'history' not in st.session_state:
        st.session_state.history = {}

    if 'conversation' not in st.session_state:
        st.session_state.conversation = []
    
    # Ensure 'user_question' is initialized in session_state
    if 'user_question' not in st.session_state:
        st.session_state.user_question = ''

    # A callback function to update 'user_question' in session_state
    def update_user_question():
        st.session_state.user_question = st.session_state.new_user_question

    # Input for user questions with an on_change callback
    st.text_input("Ask your question here:", key="new_user_question", on_change=update_user_question)

    if st.button("Ask"):
        if st.session_state.user_question:  # Now safely using 'user_question' from session_state
            st.session_state.conversation.append(f"You: {st.session_state.user_question}")
            st.session_state.history = user_input(st.session_state.user_question, st.session_state.history)

    # Inject custom CSS for conversation history
    custom_css = """
    <style>
        .stExpander > div > div:first-child {
            max-height: 500px; /* Adjust based on your needs */
            overflow-y: auto;
        }
        .stMarkdown {
            word-wrap: break-word;
        }
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)

    # Display the conversation history in a scrollable container
    with st.expander("Conversation History", expanded=True):
        for message in st.session_state.conversation:
            st.markdown(message)

    # Sidebar for additional functionalities
    with st.sidebar:
        st.title("Menu:")
        # PDF Upload and Process PDFs button logic updated
        uploaded_pdfs = st.file_uploader("Upload a PDF", type=['pdf'], accept_multiple_files=True)

        if st.button("Process PDFs"):
            with st.spinner("Processing PDFs..."):
                # Variable for the path, which could be either a directory or a single PDF file
                pdf_path = '/Users/dhruv590/Projects/RAG/SCU.pdf'  # This can be a directory or a single PDF file
                
                all_text = ""
                
                # Check if the path is a directory and process all PDFs within it
                if os.path.isdir(pdf_path):
                    pdf_docs = [os.path.join(pdf_path, f) for f in os.listdir(pdf_path) if f.endswith('.pdf')]
                    all_text += get_pdf_text(pdf_docs)
                
                # If it's not a directory, check if it's a file and process the single PDF
                elif os.path.isfile(pdf_path) and pdf_path.endswith('.pdf'):
                    all_text += get_pdf_text([pdf_path])
                
                # Process uploaded PDFs
                if uploaded_pdfs:
                    all_text += get_pdf_text(uploaded_pdfs)  # Ensure get_pdf_text can handle uploaded file objects
                
                # Proceed with processing the accumulated text
                if all_text:
                    text_chunks = get_text_chunks(all_text)
                    get_vector_store_from_text(text_chunks)
                    st.success("PDF Processing Done")
                else:
                    st.warning("No PDFs were processed. Please upload PDFs or check the specified directory.")
        
        #CSV upload and processing
        csv_docs = st.file_uploader("Upload your CSV Files and Click on the Submit & Process Button", accept_multiple_files=True, type=["csv"])
        if st.button("Submit & Process", key=2):
            with st.spinner("Processing..."):
                csv_docs = get_csv_docs(csv_docs)
                get_vector_store_from_docs(csv_docs)
                st.success("Done") 

        # Web URL processing form
        url = st.text_input('URL', 'Enter URL here')
        if st.button("Submit & Process URL"):
            with st.spinner("Processing..."):
                web_text = get_web_docs(url)
                documents = get_text_chunks(web_text)  # Assuming this processes the web text into a suitable format
                get_vector_store_from_docs(documents)
                st.success("Web Processing Done")

# Be sure to include the user_input function or any other necessary parts before this if statement
if __name__ == "__main__":
    main()

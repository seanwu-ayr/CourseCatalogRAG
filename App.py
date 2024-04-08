import streamlit as st
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import json
from langchain_community.document_loaders import WebBaseLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate

from typing import List
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field

from dotenv import load_dotenv

load_dotenv()
os.environ["OPENAI_API_KEY"] = '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'

def read_pdf_from_path(path):
    if os.path.isdir(path):  # If the path is a directory
        pdf_files = [f for f in os.listdir(path) if f.endswith('.pdf')]
        pdf_docs = [os.path.join(path, f) for f in pdf_files]
    elif os.path.isfile(path) and path.endswith('.pdf'):  # If the path is a single PDF file
        pdf_docs = [path]  # Wrap the single file path in a list
    else:
        raise ValueError("Provided path is neither a directory containing PDFs nor a PDF file.")
    return get_pdf_text(pdf_docs)


def get_pdf_text(pdf_docs):
    text=""
    for pdf in pdf_docs:
        pdf_reader= PdfReader(pdf)
        for page in pdf_reader.pages:
            text+= page.extract_text()
    return  text

def get_web_text(web_url):
    loader = WebBaseLoader(web_url)
    text = loader.load()
    print(type(text))
    print(text)
    return text

def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    chunks = text_splitter.split_text(text)
    return chunks


def get_pdf_vector_store(text_chunks):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local("faiss_index")
    
def get_web_vector_store(documents):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_documents(documents, embedding=embeddings)
    vector_store.save_local("faiss_index")

class Category(BaseModel):
    id: int = Field(description="numerical value of prompt category")
    description: str = Field(description="description of prompt category")

def get_LLM_chain():

    prompt_template = """
You are an AI tool that works as an initial module of an AI college advisor LLM that handles questions from students at Santa Clara University.
 Your only job is to categorize a prompt into what type of request they are, so they can be handled separately later with different actions.
   The possible prompt categories are listed below. If a prompt branch does not fit into any of the first listed categories,
     place it into the 'other' category (i.e. category 5). Return the structured ouput JSON with the numerical value and description associated with the propper prompt category.

Prompt category key:
  category 1: Greetings or other phatic communication
  category 2: General advice
  category 3: Dates, deadlines, etc.
  category 4: Specific course info or course database queries
  category 5: Other/miscellaneous

Example input 1: "How many units should a freshman ECEN major take"
Example output 1: "2: General advice"

Example input 2: "What are some recommendations for course options for a freshman ECEN major"
Example output 2: "4: Specific course info or course database queries"

Example input 3: "What honors course sections will be available next quarter"
Example output 3: "4: Specific course info or course database queries"

Example input 4: "When can I sign up for next quarter's honors course sections"
Example output 4: "3: Dates, deadlines, etc."

Example input 5: "Would you recommend that I sign up for next quarter's honors course sections"
Example output 5: "4: Specific course info or course database queries"

Example input 6: "Hello"
Example output 6: "1: Greetings or other phatic communication"

Example input 7: "How can I balance my school and social life at college"
Example output 7: "2: General advice"

Example input 8: "What frats are the most social"
Example output 8: "5: Other/miscellaneous"

Example input 9: "Thanks!"
Example output 9: "1: Greetings or other phatic communication"

Student input prompt: {question}
Context: {context}

Output JSON:
"""

    model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)
    parser = JsonOutputParser(pydantic_object=Category)
    prompt = PromptTemplate(
        template = prompt_template,
        input_variables = ["context", "question"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain


def get_document_chain():

    prompt_template = """
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
    provided context just say, "answer is not available in the context", don't provide the wrong answer\n\n
    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)


    prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain

def get_conversational_chain():

    prompt_template = """
    You are a friendly, supportive AI Advisory bot for students at Santa Clara University. 
    Respond to students' communication enthusiastically and supportively. Do not provide misinformation
    or answer questions you are unsure of.\n\n
    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)


    prompt = PromptTemplate(template = prompt_template, input_variables = ["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)

    return chain



def user_input(user_question):
    chain0 = get_LLM_chain()

    embeddings = OpenAIEmbeddings()
    
    response = chain0.invoke(
        {"question": user_question, "input_documents": {}}
        , return_only_outputs=True
    )

    category = json.loads(response["output_text"])["category"]
    print(category)
    
    match category:
        case 1:
            chain = get_conversational_chain()
            docs = {}
            response = chain.invoke(
            {"question": user_question, "input_documents":docs}
            , return_only_outputs=True
            )
            output = response["output_text"]

        case 2:
            chain = get_document_chain()            
            new_db = FAISS.load_local("faiss_index", embeddings)
            docs = new_db.similarity_search(user_question)
            response = chain.invoke(
            {"question": user_question, "input_documents":docs}
            , return_only_outputs=True
            )
            output = response["output_text"]

        case 3:
            chain = get_document_chain()
            new_db = FAISS.load_local("faiss_index", embeddings)
            docs = new_db.similarity_search(user_question)
            response = chain.invoke(
            {"question": user_question, "input_documents":docs}
            , return_only_outputs=True
            )
            output = response["output_text"]

        case 4:
            chain = get_document_chain()
            new_db = FAISS.load_local("faiss_index", embeddings)
            docs = new_db.similarity_search(user_question)
            response = chain.invoke(
            {"question": user_question, "input_documents":docs}
            , return_only_outputs=True
            )
            output = response["output_text"]

        case 5:
            output = "Sorry, your input prompt is outside the scope of my capabilities."
        case _:
            print("default")
            
    print(output)
    # Log the question and answer
    with open("conversation_log.txt", "a") as log_file:
        log_file.write(f"Question: {user_question}\nAnswer: {output}\n\n")
    st.session_state.conversation.append(f"Reply: {output}")  # Append the answer to the conversation history

def main():
    st.set_page_config("Chat PDF")
    st.header("Santa Clara Course Catalog LLM")

    # Initialize or retrieve the conversation history
    if 'conversation' not in st.session_state:
        st.session_state.conversation = []

    # Input for user questions
    user_question = st.text_input("Ask your question here:", key="user_question")

    if st.button("Ask") or 'enter_pressed' in st.session_state:
        if user_question:
            st.session_state.conversation.append(f"You: {user_question}")
            user_input(user_question)
            st.session_state['enter_pressed'] = False

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

        # Automatically process PDFs from a specified path
        pdf_path = '/Users/dhruv590/Projects/RAG/SCU.pdf'  # Update this with the actual path
        if st.button("Process PDFs"):
            with st.spinner("Processing PDFs..."):
                raw_text = read_pdf_from_path(pdf_path)
                text_chunks = get_text_chunks(raw_text)
                get_pdf_vector_store(text_chunks)
                st.success("PDF Processing Done")

        # Web URL processing form
        url = st.text_input('URL', 'Enter URL here')
        if st.button("Submit & Process URL"):
            with st.spinner("Processing..."):
                web_text = get_web_text(url)
                documents = get_text_chunks(web_text)  # Assuming this processes the web text into a suitable format
                get_web_vector_store(documents)
                st.success("Web Processing Done")

# Be sure to include the user_input function or any other necessary parts before this if statement
if __name__ == "__main__":
    main()

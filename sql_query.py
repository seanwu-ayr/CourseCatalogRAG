from pydantic import BaseModel
from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool, QuerySQLCheckerTool
from langchain.chains import create_sql_query_chain
from typing import List, Dict, Any, Optional
from langchain.callbacks.manager import CallbackManagerForRetrieverRun, AsyncCallbackManagerForRetrieverRun
from sqlalchemy import create_engine
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv, find_dotenv
import os
import getpass
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
import time
from langchain.retrievers import EnsembleRetriever



# It's so beautiful but I fucking hate this thing
################################################################################################################
class SQLRetriever(BaseRetriever):
    llm: Any  # The language model used for generating SQL queries
    db: SQLDatabase  # The database instance for connecting and running SQL queries

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        """
        Synchronous method to retrieve relevant documents based on the query.
        
        Args:
        - query: String query to be converted into SQL.
        - run_manager: Callback manager to handle progress or other callback functionality.

        Returns:
        - List[Document]: List of LangChain Document objects.
        """
        # Create and execute the SQL query chain
        write_query = create_sql_query_chain(llm, db)
        check_query = QuerySQLCheckerTool(llm=llm, db=db)
        execute_query = QuerySQLDataBaseTool(db=db)
        query_chain = write_query | check_query | execute_query
        response = query_chain.invoke({"question": query})
        
        # Convert SQL results into LangChain Document objects
        documents = self._format_sql_result(response)
        return documents

    async def _aget_relevant_documents(
        self, query: str, *, run_manager: AsyncCallbackManagerForRetrieverRun
    ) -> List[Document]:
        """
        Asynchronous method to retrieve relevant documents based on the query.
        
        Args:
        - query: String query to be converted into SQL.
        - run_manager: AsyncCallbackManager to handle async callbacks.

        Returns:
        - List[Document]: List of LangChain Document objects.
        """
        # Create and execute the SQL query chain
        write_query = create_sql_query_chain(llm, db)
        check_query = QuerySQLCheckerTool(llm=llm, db=db)
        execute_query = QuerySQLDataBaseTool(db=db)
        query_chain = write_query | check_query | execute_query
        response = await query_chain.invoke_async({"question": query})
        
        # Convert SQL results into LangChain Document objects
        documents = self._format_sql_result(response)
        return documents

    def _format_sql_result(self, result: Any) -> List[Document]:
        """
        Formats the SQL query result into LangChain Document objects.
        
        Args:
        - result: The raw result from the SQL query execution.

        Returns:
        - List[Document]: A list of LangChain Document objects, each containing 
          a row of the SQL result with metadata.
        """
        documents = []
        content = str(result)  # Convert the row into a string or format as needed
        metadata = {"source": "SQL Database"}  # Add any additional metadata as needed
        documents.append(Document(page_content=content, metadata=metadata))
        
        return documents
################################################################################################################




# Setup Openai
load_dotenv(find_dotenv()) 
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
llm = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)

# Setup the database connection
host = "scu-info.cpkec8qcwpzs.us-east-2.rds.amazonaws.com"
port = 5432  # Default PostgreSQL port
database = "SCU_INFO"
user = "sakadaai"
password = "sakadaai2000"
db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"
engine = create_engine(db_url)
db = SQLDatabase(engine)

# Initialize custom retriever
sql_retriever = SQLRetriever(llm=llm, db=db)

# Test sql retrieval 
documents = sql_retriever._get_relevant_documents("What is the acla102Z course?", run_manager=None)
for doc in documents:
    print(doc.page_content)



# IMPORTANT: BEFORE YOU TRY ANYTHING BELOW, MAKE SURE THE STUFF ABOVE WORKS FIRST
# This pinecone initialization is already in views.py
# I've changed to new pinecone gitbook/calendar-only db
##############################################################################################################

index_name = "calendar-gitbook-scu"
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

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = PineconeVectorStore(index=index, embedding=embeddings, namespace=index_namespace)
pinecone_retriever =  vectorstore.as_retriever(
    search_kwargs={"k": 10}
)
##############################################################################################################

ensemble_retriever = EnsembleRetriever(
    retrievers=[sql_retriever, pinecone_retriever], weights=[0.5, 0.5]
)

ensemble_retriever.invoke("what are prerequisites to csen11")

config = {"configurable": {"search_kwargs_faiss": {"k": 3}}}
print(ensemble_retriever.invoke("apples", config=config))
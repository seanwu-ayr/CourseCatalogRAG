from sqlalchemy import create_engine
import getpass
import os
from operator import itemgetter
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv, find_dotenv

from langchain_community.agent_toolkits import create_sql_agent

load_dotenv(find_dotenv())
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# Database connection parameters
host = "scu-info.cpkec8qcwpzs.us-east-2.rds.amazonaws.com"
port = 5432  # Default PostgreSQL port
database = "SCU_INFO"
user = "sakadaai"
password = "sakadaai2000"

# Create the SQLAlchemy engine
db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"
engine = create_engine(db_url)
db = SQLDatabase(engine)

# print(db.dialect)
# print(db.get_usable_table_names())

llm = ChatOpenAI(model="gpt-4o", temperature=0)


# # Create a tool to execute queries on the database
# execute_query = QuerySQLDataBaseTool(db=db)

# # Create an SQL query chain using the language model and database
# write_query = create_sql_query_chain(llm, db)

# # Create a prompt template for answering questions based on SQL query results
# answer_prompt = PromptTemplate.from_template(
#     """Given the following user question, corresponding SQL query, and SQL result, answer the user question.

# Question: {question}
# SQL Query: {query}
# SQL Result: {result}
# Answer: """
# )

# # Chain to generate the answer based on the query and result
# answer = answer_prompt | llm | StrOutputParser()

# # Define the full chain of operations
# chain = (
#     RunnablePassthrough.assign(query=write_query).assign(
#         result=itemgetter("query") | execute_query
#     )
#     | answer
# )
# # Invoke the chain with a user question
# print(chain.invoke({"question": "What is the ACLA_102Z course?"}))

agent_executor = create_sql_agent(llm, db=db, agent_type="openai-tools", verbose=True)
print(agent_executor.invoke({"input":"What is the ACLA_102Z course?"}))
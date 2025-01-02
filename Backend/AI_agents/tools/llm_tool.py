
from langchain.agents import Tool
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
import os



# from langchain.llms import ChatOpenAI
from langchain.chat_models import ChatOpenAI


documents = [
   ""
    ]
 

def create_retrieval_qa_tool(vector_store):
    retriever = vector_store.as_retriever()
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    retrieval_qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
    )

    retrieval_tool = Tool(
        name="DocumentRetriever",
        func=retrieval_qa.run,
        description="Retrieve relevant documents from the knowledge base.",
    )
    return retrieval_tool


def initialize_vector_store(documents):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_texts(documents, embeddings)
    return vector_store

 # Initialize the Vector Store
vector_store = initialize_vector_store(documents)

# Create the RetrievalQA Tool
retrieval_tool = create_retrieval_qa_tool(vector_store)


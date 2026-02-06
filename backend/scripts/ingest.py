"""
Document ingestion script for LLM Security Gateway.

This script loads policy documents, splits them into chunks,
and stores them in a ChromaDB vector database for semantic search.
"""

import os
from pathlib import Path
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

# Load environment variables (for API keys)
load_dotenv()

# Configuration constants
DATA_PATH = "./data/security_policy.txt"
DB_PATH = "./chroma_db"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def ingest_docs(data_path: str = DATA_PATH, db_path: str = DB_PATH) -> None:
    """
    Ingest documents into the vector database.
    
    Args:
        data_path: Path to the document file to ingest
        db_path: Path where the ChromaDB will be stored
        
    Raises:
        FileNotFoundError: If the data file doesn't exist
        Exception: If ingestion fails
    """
    print("🚀 Starting ingestion process...")
    
    # Validate input file exists
    if not os.path.exists(data_path):
        error_msg = (
            f"❌ Error: File not found at {data_path}\n"
            "Make sure you are running this script from the 'backend' directory!"
        )
        print(error_msg)
        raise FileNotFoundError(error_msg)
    
    # Load document
    print(f"📄 Loading document from {data_path}...")
    loader = TextLoader(data_path)
    documents = loader.load()
    print(f"✅ Loaded {len(documents)} document(s)")
    
    # Split documents into chunks
    print("✂️  Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    chunks = text_splitter.split_documents(documents)
    print(f"✅ Split into {len(chunks)} chunks")
    
    # Create embeddings and save to vector database
    print("⏳ Creating embeddings and saving to ChromaDB...")
    try:
        embeddings = OpenAIEmbeddings(
            model="openai/text-embedding-3-small",
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY")
        )     
        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=db_path
        )
        
        print(f"🎉 Success! Data ingested into {db_path}")
        print(f"📊 Total chunks stored: {len(chunks)}")
        
    except Exception as e:
        error_msg = f"❌ Failed to create embeddings or save to database: {str(e)}"
        print(error_msg)
        raise Exception(error_msg) from e


if __name__ == "__main__":
    ingest_docs()

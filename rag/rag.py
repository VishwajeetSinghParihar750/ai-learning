from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import chromadb 
import os

load_dotenv()

embeddingModel = SentenceTransformer(os.getenv("EMBEDDING_MODEL"))
chromaClient = chromadb.PersistentClient(path="./chromaDbData")
collection = chromaClient.get_or_create_collection(name = "codebase")


def rag(text : str):
    print(f"finding embedding for string : {text}")

    embedding = embeddingModel.encode(text)

    print(f"finding results for embedding : {embedding}")
    
    matchResults = collection.query(query_embeddings=embedding.tolist(), n_results=10)

    print(matchResults)

while 1:
    text = input()
    rag(text)
    
print(os.getenv("EMBEDDING_MODEL"))
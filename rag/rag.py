from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
import os

load_dotenv()

embeddingModel = SentenceTransformer(os.getenv("EMBEDDING_MODEL"))


pc = Pinecone(api_key= os.getenv("PINECONE_API_KEY"))
codebaseName = "codebase-8512"
index = pc.index(codebaseName)


def getSemanticMatches(text : str):
    print(f"finding embedding for string : {text}")

    embedding = embeddingModel.encode(text)

    print(f"finding results for found embedding ")
    
    queryResult = index.query(vector=embedding.tolist(), top_k=10, include_values= False, include_metadata= True)


    return [{
        "doc_id" : match.id,
        "score" : match.score,
        "data" : match.metadata
    } for match in queryResult.matches]

def getLiteralMatches(text : str):
    return []

def rag(text : str):
    semanticMatches = getSemanticMatches(text)
    literalMatches = getLiteralMatches(text)
    

while 1:
    text = input()
    matches = rag(text)
    for match in matches:
        print(match)


print(os.getenv("EMBEDDING_MODEL"))
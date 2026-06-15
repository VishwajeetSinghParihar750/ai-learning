
from pathlib import Path
import os
# from sentence_transformers import SentenceTransformer
import chromadb
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

chromaClient = chromadb.PersistentClient(path = "./chromaDbData")
collection = chromaClient.get_or_create_collection(name = "codebase")

# i wanna go through the whole codebase and each file i wanna embed separately 
# need to use ai for embedding 
geminiClient = genai.Client(api_key= os.getenv("GEMINI_API_KEY"))

geminiSytemPrompt = """

You are an expert document chunking system for Retrieval-Augmented Generation (RAG).

Your task is to split a document into semantically meaningful chunks.

Rules:

1. Preserve meaning.
   - Keep related ideas together.
   - Never split a sentence.
   - Avoid splitting paragraphs unless necessary.

2. Respect document structure.
   - Use headings, sections, subsections, lists, tables, and code blocks as natural boundaries.
   - If a section is small, keep it with its parent section.

3. Code handling.
   - Keep complete functions, classes, and code examples together.
   - Never split code in the middle of a function or class.
   - Include surrounding explanations when relevant.

4. Chunk size.
   - Target approximately 300-800 words per chunk.
   - Chunks may be smaller or larger when required to preserve meaning.

5. Context preservation.
   - Each chunk should be understandable when retrieved independently.
   - Include relevant headings at the beginning of the chunk.

6. Overlap.
   - Include 1-3 sentences of overlap from the previous chunk when a topic continues across chunks.

7. Metadata extraction.
   For each chunk return:
   - chunk_id
   - title
   - section_path
   - content

Output JSON only.

Format:

{
  "chunks": [
    {
      "chunk_id": "1",
      "title": "...",
      "section_path": ["...", "..."],
      "content": "..."
    }
  ]
}

Document:

{{DOCUMENT_PATH}}
{{DOCUMENT_CONTENT}}
"""


class chunkSchema(BaseModel):
    chunk_id:str
    title:str
    
    section_path: str
    content: str
class chunksSchema(BaseModel):
    chunks: list[chunkSchema]

geminiConfig  = genai.types.GenerateContentConfig(system_instruction=geminiSytemPrompt, response_schema= chunksSchema ,response_mime_type="application/json")

def getEmbedding(text : str)->list[int]:
    res = geminiClient.models.generate_content(
        model = "gemini-2.5-flash",
        contents = text,
        config= geminiConfig
    )
    return res.text


def embed():
    root = Path("./codebase")

    for file in root.rglob("*"):
        if file.is_file():
            print(file)
            # fileData = file.read_text(encoding="utf-8")
            # toEmbed = geminiSytemPrompt.replace("{{DOCUMENT_CONTENT}}" , fileData).replace("{{DOCUMENT_PATH}}", file._str)
            # print(toEmbed)
            # embedding = getEmbedding(toEmbed)
            # print(embedding)

                


                

            
embed()


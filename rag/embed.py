
from pathlib import Path
import os
from sentence_transformers import SentenceTransformer
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel
from pinecone import Pinecone, ServerlessSpec
from random import randint

load_dotenv()

pc =  Pinecone(api_key= os.getenv("PINECONE_API_KEY") )
codebaseName = f"codebase-{randint(1, 12323)}"
pc.create_index(name=codebaseName, dimension=384, spec= ServerlessSpec(region="us-east-1", cloud="aws"))
index = pc.index(codebaseName)

embeddingModel = SentenceTransformer(model_name_or_path= os.getenv("EMBEDDING_MODEL"))

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
   - title
   - section_path
   - content

Output JSON only.

Format:

{
  "chunks": [
    {
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
    title:str
    section_path: str
    content: str
class chunksSchema(BaseModel):
    chunks: list[chunkSchema]

geminiConfig  = genai.types.GenerateContentConfig(system_instruction=geminiSytemPrompt, response_schema= chunksSchema ,response_mime_type="application/json")

def getChunks(text : str)->list[chunkSchema]:
    res = geminiClient.models.generate_content(
        model = "gemini-2.5-flash",
        contents = text,
        config= geminiConfig
    )
    return res.parsed.chunks



def embed():
   root = Path("./codebase")

   print('came here')
   for file in root.rglob("*"):
      
      
      
      print(file._str)

      if file.is_file():

         fileSize = file.stat().st_size 
         if  fileSize > 1000: 
               print(f"skipped file {file._str} cause its size is {fileSize} ")
               continue
         

         fileData = file.read_text(encoding="utf-8")

         toEmbed = geminiSytemPrompt.replace("{{DOCUMENT_CONTENT}}" , fileData).replace("{{DOCUMENT_PATH}}", file._str)

         print(f"processing file: {file._str}, fileSize : {fileSize}")

         chunks = getChunks(toEmbed)
         print([chunk.title for chunk in chunks])


         embeddings = embeddingModel.encode(
            [chunk.content for chunk in chunks]
         ).tolist()

         index.upsert(
            vectors=[
               {
                     "id": f"{file}_{i}",
                     "metadata": {
                        "title": chunk.title,
                        "section_path": chunk.section_path,
                        "content": chunk.content
                     },
                     "values": embeddings[i]
               }
               for i, chunk in enumerate(chunks)
            ]
         )

         
         
            
embed()


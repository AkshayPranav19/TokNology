
from langchain_text_splitters import RecursiveCharacterTextSplitter
splitter=RecursiveCharacterTextSplitter(chunk_size=1200,chunk_overlap=200)
def chunk_text(text:str):
    return splitter.create_documents([text])

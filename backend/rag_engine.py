import os
import json
from typing import List
from langchain_community.document_loaders import DirectoryLoader, TextLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

class RAGEngine:
    def __init__(self, data_dir: str = "../data/knowledge", persist_dir: str = "../data/chroma"):
        self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), data_dir))
        self.persist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), persist_dir))
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None
        
    def ingest_documents(self):
        """Loads documents from the data directory and stores them in the vector store."""
        
        all_docs = []
        
        # 1. Walk through subdirectories for categorized ingestion
        for root, dirs, files in os.walk(self.data_dir):
            category = os.path.basename(root) if root != self.data_dir else "general"
            
            for file in files:
                full_path = os.path.join(root, file)
                
                # Load Markdown files
                if file.endswith(".md"):
                    try:
                        loader = TextLoader(full_path)
                        docs = loader.load()
                        for doc in docs:
                            doc.metadata["category"] = category
                            doc.metadata["doc_id"] = file
                            doc.metadata["page_number"] = 1
                            doc.metadata["clause_id"] = "N/A"
                            doc.metadata["version"] = "1.0"
                            doc.metadata["source_url"] = f"file://{full_path}"
                        all_docs.extend(docs)
                    except Exception as e:
                        print(f"Error loading {file}: {e}")
                
                # Load JSONL and JSON files
                elif file.endswith(".jsonl"):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    doc = self._parse_playbook_json(data, full_path, category)
                                    all_docs.append(doc)
                                except Exception as e:
                                    print(f"Error parsing line in {file}: {e}")
                                    
                elif file.endswith(".json") and not file.endswith("audit_log.json"):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        try:
                            data = json.load(f)
                            if isinstance(data, list):
                                for item in data:
                                    all_docs.append(self._parse_playbook_json(item, full_path, category))
                            else:
                                all_docs.append(self._parse_playbook_json(data, full_path, category))
                        except Exception as e:
                            print(f"Error parsing {file}: {e}")

        if not all_docs:
            print("No documents found to ingest.")
            return

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(all_docs)
        
        self.vector_store = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_dir
        )
        print(f"Ingested {len(splits)} document chunks.")

    def _parse_playbook_json(self, data: dict, source_path: str, category: str = "playbook") -> Document:
        """Converts a playbook JSON object into a readable text document with enriched metadata."""
        incident_type = data.get('incident_type', 'Unknown Incident')
        incident_id = data.get('incident_id', 'N/A')
        
        # Enriched metadata fields
        doc_id = data.get('doc_id', incident_id)
        page_number = data.get('page_number', 1)
        clause_id = data.get('clause_id', 'N/A')
        version = data.get('version', '1.0')
        source_url = data.get('source_url', f"file://{source_path}")

        content = f"--- Incident Playbook: {incident_type} ({incident_id}) ---\n"
        content += f"Detection Source: {data.get('detection_source', 'N/A')}\n"
        content += f"Initial Vector: {data.get('initial_vector', 'N/A')}\n"
        content += f"Severity: {data.get('severity', 'N/A')}\n"
        
        if 'tactics_techniques' in data:
            content += "Tactics & Techniques:\n"
            for tt in data['tactics_techniques']:
                content += f"- {tt.get('tactic')}: {tt.get('technique')}\n"
        
        if 'playbook_steps' in data:
            content += "Response Playbook Steps:\n"
            for step in data['playbook_steps']:
                phase = step.get('phase', 'Action')
                action = step.get('action', '')
                tools = ", ".join(step.get('tools', []))
                content += f"- [{phase}] {action} (Tools: {tools})\n"
        
        if 'tags' in data:
            content += f"Tags: {', '.join(data['tags'])}\n"
            
        return Document(
            page_content=content, 
            metadata={
                "source": source_path, 
                "category": category,
                "type": "playbook", 
                "incident_id": incident_id,
                "incident_type": incident_type,
                "doc_id": doc_id,
                "page_number": page_number,
                "clause_id": clause_id,
                "version": version,
                "source_url": source_url
            }
        )

    def query(self, query: str, k: int = 3):
        """Retrieves relevant document chunks for a given query."""
        if not self.vector_store:
            self.vector_store = Chroma(
                persist_directory=self.persist_dir, 
                embedding_function=self.embeddings
            )
        
        return self.vector_store.similarity_search(query, k=k)

if __name__ == "__main__":
    # Test script
    engine = RAGEngine()
    engine.ingest_documents()
    results = engine.query("How to handle SSH brute force?")
    for res in results:
        print(f"--- Document: {res.metadata['source']} ---")
        print(res.page_content[:200])

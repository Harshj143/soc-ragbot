# SOC RAGBot - Secure Incident Investigator

SOC RAGBot is an advanced AI-powered Security Operations Center (SOC) assistant that leverages Retrieval-Augmented Generation (RAG) to provide fast, accurate, and secure incident investigation reports. It combines institutional knowledge (playbooks) with raw security logs to deliver actionable insights to security analysts.

## 🚀 Key Features

### 1. Advanced RAG Engine
- **Enriched Metadata**: Every document chunk is tagged with `doc_id`, `version`, `page_number`, and `source_url` for complete traceability.
- **Citation-Aware Retrieval**: The AI provides specific citations `[Source X]` for every finding, mapping responses directly to approved security playbooks.
- **Source Binding**: Ensures the LLM answers strictly from provided context, preventing "hallucinations" of non-existent policies.

### 2. High-Performance Optimization
- **Semantic Caching**: Implements an intelligent caching layer using SQLite and OpenAI embeddings. Similar queries are served instantly (latency reduced from ~10s to <0.3s).
- **Model Orchestration**: Uses a multi-model approach. `GPT-4o-mini` handles lightweight intent classification, while `GPT-4o` powers deep investigation, balancing speed and reasoning.

### 3. Fortified Security
- **Input Sanitization**: A deterministic security guard layer neutralizes prompt injection patterns (e.g., "Ignore previous instructions") before they reach the LLM.
- **Jailbreak Detection**: The intent classifier is trained to detect adversarial queries designed to extract system prompts or bypass filters.
- **Role-Based Access Control (RBAC)**: Enforces strict permissions. `Viewer` roles are restricted from sensitive operations like raw log analysis, which is reserved for `Admin` users.

### 4. Enterprise-Grade Auditing
- **Audit & Replay Layer**: Every interaction is logged in a structured JSON format, capturing the query, retrieved chunks, LLM parameters, and the final report for compliance and review.

---

## 🛠 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Harshj143/soc-ragbot.git
   cd soc-ragbot/backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY and AUTH secrets
   ```
4. Ingest and run:
   ```bash
   # Ingest knowledge base
   python main.py  # Run the FastAPI server
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Privacy
- **Stateless Agent**: The investigator agent isolates state per-query to prevent cross-contamination of sessions.
- **Zero-Trust Input**: All user inputs are treated as data, never as control instructions.
- **Local Data Control**: Vector indices and audit logs are kept locally and excluded from version control to prevent data leaks.

---

## 📊 Performance Benchmarks
| Query Type | Typical Latency | Source |
| :--- | :--- | :--- |
| First-time Query | ~7.0s | LLM + Vector Scan |
| Identical Cache Hit | <0.2s | SQLite Cache |
| Semantic Match | <0.2s | Local Embedding Match |

---

## 📜 License
Internal Security Tooling - Use according to corporate policy.

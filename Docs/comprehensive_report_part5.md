## 5. SYSTEM DESIGN

### 5.1 System Architecture

The Educational Assistant Chatbot employs a modern, scalable architecture:

```mermaid
graph TB
    subgraph "Frontend Layer" [" 🖥️ Frontend Layer"]
        UI["📱 React UI Components<br/>(Material UI, TailwindCSS)<br/>• Chat Interface<br/>• File Upload<br/>• Language Selector"]
        I18N["🌐 Internationalization<br/>(i18next)<br/>• 10 Indian Languages<br/>• RTL Support<br/>• Dynamic Loading"]
        State["⚡ State Management<br/>(Redux)<br/>• Chat History<br/>• User Preferences<br/>• Cache Management"]
    end

    subgraph "API Layer" [" 🔌 API Layer"]
        API["⚙️ Flask API Server<br/>(Python 3.9+)<br/>• RESTful Endpoints<br/>• WebSocket Support<br/>• Error Handling"]
        Auth["🔐 Authentication<br/>(JWT)<br/>• Token Management<br/>• Role-based Access<br/>• Session Control"]
        Cache["💾 Response Cache<br/>(Redis)<br/>• Query Results<br/>• Session Data<br/>• Rate Limiting"]
    end

    subgraph "Processing Layer" [" 🧠 Processing Layer"]
        NLP["🤖 NLP Engine<br/>(NLTK, spaCy)<br/>• Entity Recognition<br/>• Intent Classification<br/>• Sentiment Analysis"]
        Trans["🔄 Translation Service<br/>(Google Translate)<br/>• Auto Detection<br/>• Batch Translation<br/>• Custom Dictionary"]
        Search["🔍 Search Engine<br/>(Elasticsearch)<br/>• Fuzzy Matching<br/>• Relevance Scoring<br/>• Query DSL"]
    end

    subgraph "Data Layer" [" 💾 Data Layer"]
        ED[("📚 Educational Data<br/>(MongoDB)<br/>• Course Info<br/>• Institution Data<br/>• Academic Programs")]
        CD[("🏫 College Database<br/>(PostgreSQL)<br/>• College Profiles<br/>• Admission Data<br/>• Rankings")]
        CH[("💬 Chat History<br/>(Redis)<br/>• User Sessions<br/>• Query Logs<br/>• Analytics")]
    end

    UI --> API
    API --> NLP
    NLP --> ED
    Search --> CD
```

### 5.2 DataFlow Diagram

#### Level 0 DFD

```mermaid
graph LR
    User(("👤 User"))
    System(("🤖 Educational<br/>Assistant System"))
    DB[("📚 Knowledge Base")]
    
    User -->|"Query/Request"| System
    System -->|"Response/Info"| User
    System <-->|"Data Access"| DB
    
    style User fill:#bbdefb,stroke:#2196f3,stroke-width:2px
    style System fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
    style DB fill:#ffe0b2,stroke:#ff9800,stroke-width:2px
```

#### Level 1 DFD

```mermaid
graph TB
    subgraph "User Interface Layer"
        User(("👤 User"))
        WebUI["💻 Web Interface"]
        Mobile["📱 Mobile App"]
        Voice["🎤 Voice Interface"]
    end
    
    subgraph "Processing Layer"
        NLP["🧠 NLP Engine"]
        ML["🤖 ML Pipeline"]
        Search["🔍 Search Service"]
        Trans["🌐 Translator"]
    end
    
    subgraph "Data Layer"
        Cache[("💾 Redis Cache")]
        DB[("🗄️ Main Database")]
        Files[("📂 File Storage")]
    end
    
    User -->|"Input"| WebUI & Mobile & Voice
    WebUI & Mobile & Voice -->|"Process"| NLP
    NLP -->|"Analyze"| ML
    ML -->|"Search"| Search
    Search -->|"Store"| Cache
    Cache -->|"Persist"| DB
    DB -->|"Retrieve"| Files
```

### 5.3 UML Diagram

#### Class Diagram

```mermaid
classDiagram
    class ChatSystem {
        -conversation_history: List
        -language_support: Dict
        -max_history_size: int
        -current_language: str
        +process_query(query: str)
        +translate_response(text: str, lang: str)
        +clear_history()
        +change_language(lang: str)
    }
    
    class QueryProcessor {
        -nlp_engine: NLPEngine
        -query_classifier: Classifier
        -response_formatter: Formatter
        +process_college_query(query: str)
        +process_exam_query(query: str)
        +process_scholarship_query(query: str)
        -classify_query(query: str)
    }
    
    class DataManager {
        -education_data: Dict
        -college_data: Dict
        -cache: Cache
        -db_connection: DBConnection
        +get_college_info(query: str)
        +get_exam_info(query: str)
        +update_cache(key: str, data: Dict)
        -connect_db()
    }
    
    ChatSystem --> QueryProcessor
    ChatSystem --> DataManager
    QueryProcessor --> DataManager
```

### 5.4 Usecase Diagram

```mermaid
graph TB
    subgraph "User Actions"
        A["Ask Educational Query"]
        B["Upload Documents"]
        C["Change Language"]
        D["View College Info"]
        E["Get Exam Details"]
        F["Search Scholarships"]
    end
    
    subgraph "System Actions"
        G["Process Query"]
        H["Translate Content"]
        I["Search Database"]
        J["Format Response"]
    end
    
    A & B & C --> G
    D & E & F --> I
    G --> H
    I --> J
    H --> J
```

[Continued in next section...] 
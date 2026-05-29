# Educational Assistant Chatbot - System Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Flow Charts](#flow-charts)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [UML Diagrams](#uml-diagrams)
5. [Problem Definition and Scope](#problem-definition-and-scope)
6. [Technical Details](#technical-details)

## 1. System Architecture

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ff7f50', 'edgeLabelBackground':'#fff', 'tertiaryColor': '#fff' } }}%%
graph TB
    subgraph "Frontend Layer" [" 🖥️ Frontend Layer"]
        UI["📱 React UI Components<br/>(Material UI, TailwindCSS)"]
        I18N["🌐 Internationalization<br/>(i18next)"]
        State["⚡ State Management<br/>(Redux)"]
        Router["🔄 Router<br/>(React Router)"]
        style UI fill:#ffcccb,stroke:#ff6b6b,stroke-width:2px
        style I18N fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
        style State fill:#ffe0b2,stroke:#ff9800,stroke-width:2px
        style Router fill:#bbdefb,stroke:#2196f3,stroke-width:2px
    end

    subgraph "API Layer" [" 🔌 API Layer"]
        API["⚙️ Flask API Server<br/>(Python 3.9+)"]
        Auth["🔐 Authentication<br/>(JWT)"]
        Cache["💾 Response Cache<br/>(Redis)"]
        Rate["⚡ Rate Limiter"]
        style API fill:#e1bee7,stroke:#9c27b0,stroke-width:2px
        style Auth fill:#fff9c4,stroke:#ffd700,stroke-width:2px
        style Cache fill:#b2dfdb,stroke:#009688,stroke-width:2px
        style Rate fill:#ffccbc,stroke:#ff5722,stroke-width:2px
    end

    subgraph "Processing Layer" [" 🧠 Processing Layer"]
        NLP["🤖 NLP Engine<br/>(NLTK, spaCy)"]
        Trans["🔄 Translation Service<br/>(Google Translate)"]
        Search["🔍 Search Engine<br/>(Elasticsearch)"]
        ML["📊 ML Models<br/>(TensorFlow)"]
        style NLP fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
        style Trans fill:#bbdefb,stroke:#2196f3,stroke-width:2px
        style Search fill:#ffe0b2,stroke:#ff9800,stroke-width:2px
        style ML fill:#f8bbd0,stroke:#e91e63,stroke-width:2px
    end

    subgraph "Data Layer" [" 💾 Data Layer"]
        ED[("📚 Educational Data<br/>(MongoDB)")]
        CD[("🏫 College Database<br/>(PostgreSQL)")]
        CH[("💬 Chat History<br/>(Redis)")]
        FS[("📁 File Storage<br/>(S3)")]
        style ED fill:#b2dfdb,stroke:#009688,stroke-width:2px
        style CD fill:#c5cae9,stroke:#3f51b5,stroke-width:2px
        style CH fill:#ffccbc,stroke:#ff5722,stroke-width:2px
        style FS fill:#d1c4e9,stroke:#673ab7,stroke-width:2px
    end

    %% Frontend Connections
    UI -->|"REST API"| API
    I18N -->|"Localization"| UI
    State -->|"State Updates"| UI
    Router -->|"Navigation"| UI

    %% API Layer Connections
    API -->|"Query"| NLP
    API -->|"Translation"| Trans
    API -->|"Search"| Search
    API -->|"Auth"| Auth
    API -->|"Cache"| Cache
    API -->|"Limit"| Rate

    %% Processing Layer Connections
    NLP -->|"Data"| ED
    Search -->|"Query"| CD
    ML -->|"Training"| ED
    Trans -->|"Text"| API

    %% Data Layer Connections
    API -->|"Store"| CH
    API -->|"Files"| FS

    classDef default fill:#fff,stroke:#333,stroke-width:1px;
    classDef highlight fill:#f9f,stroke:#333,stroke-width:2px;
```

## 2. Flow Charts

### Main Application Flow

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ff7f50', 'edgeLabelBackground':'#fff' } }}%%
flowchart TD
    A["🚀 Start"] --> B{"📝 User Input"}
    B -->|"Text Query"| C["🔍 Language Detection"]
    B -->|"File Upload"| D["📁 File Processing"]
    C --> E["⚙️ Query Processing"]
    E --> F{"🔄 Query Type"}
    
    subgraph "Query Processing"
        F -->|"College"| G["🏫 Process College Query"]
        F -->|"Exam"| H["📝 Process Exam Query"]
        F -->|"Scholarship"| I["💰 Process Scholarship Query"]
        F -->|"General"| J["🔍 General Search"]
    end
    
    subgraph "Response Generation"
        G --> K["📋 Format Response"]
        H --> K
        I --> K
        J --> K
        K --> L["🌐 Translate if needed"]
        L --> M["📤 Send Response"]
    end
    
    M -->|"New Query"| B
    D -->|"Processed"| E
    
    style A fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
    style B fill:#bbdefb,stroke:#2196f3,stroke-width:2px
    style C fill:#ffe0b2,stroke:#ff9800,stroke-width:2px
    style D fill:#e1bee7,stroke:#9c27b0,stroke-width:2px
    style E fill:#ffcccb,stroke:#ff6b6b,stroke-width:2px
    style F fill:#c5cae9,stroke:#3f51b5,stroke-width:2px
    style G fill:#b2dfdb,stroke:#009688,stroke-width:2px
    style H fill:#f8bbd0,stroke:#e91e63,stroke-width:2px
    style I fill:#fff9c4,stroke:#ffd700,stroke-width:2px
    style J fill:#d1c4e9,stroke:#673ab7,stroke-width:2px
    style K fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style L fill:#ffccbc,stroke:#ff5722,stroke-width:2px
    style M fill:#b39ddb,stroke:#673ab7,stroke-width:2px
```

## 3. Data Flow Diagrams

### Level 0 DFD

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ff7f50' } }}%%
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

### Level 1 DFD

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#ff7f50' } }}%%
graph TB
    User(("👤 User"))
    UI["📱 User Interface"]
    API["⚙️ API Server"]
    PP["🔄 Query Processor"]
    DB[("📚 Knowledge Base")]
    TR["🌐 Translation Engine"]
    
    subgraph "Frontend"
        User -->|"Input"| UI
        UI -->|"Request"| API
    end
    
    subgraph "Backend Processing"
        API -->|"Query"| PP
        PP -->|"Search"| DB
        DB -->|"Results"| PP
        PP -->|"Process"| TR
        TR -->|"Translate"| API
    end
    
    API -->|"Response"| UI
    UI -->|"Display"| User
    
    style User fill:#bbdefb,stroke:#2196f3,stroke-width:2px
    style UI fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
    style API fill:#ffe0b2,stroke:#ff9800,stroke-width:2px
    style PP fill:#e1bee7,stroke:#9c27b0,stroke-width:2px
    style DB fill:#f8bbd0,stroke:#e91e63,stroke-width:2px
    style TR fill:#c5cae9,stroke:#3f51b5,stroke-width:2px
```

## 4. UML Diagrams

### Class Diagram

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
        +process_admission_query(query: str)
        -classify_query(query: str)
        -validate_query(query: str)
    }
    
    class DataManager {
        -education_data: Dict
        -college_data: Dict
        -cache: Cache
        -db_connection: DBConnection
        +get_college_info(query: str)
        +get_exam_info(query: str)
        +update_cache(key: str, data: Dict)
        +clear_cache()
        -connect_db()
        -validate_data(data: Dict)
    }
    
    class TranslationService {
        -supported_languages: List
        -default_language: str
        -translator: Translator
        +translate(text: str, target_lang: str)
        +detect_language(text: str)
        -validate_language(lang: str)
    }
    
    ChatSystem --> QueryProcessor
    ChatSystem --> DataManager
    ChatSystem --> TranslationService
    QueryProcessor --> DataManager
    
    class NLPEngine {
        -model: Model
        -tokenizer: Tokenizer
        +process_text(text: str)
        +extract_entities(text: str)
    }
    
    QueryProcessor --> NLPEngine
```

### Use Case Diagram

```mermaid
graph TB
    subgraph "User Actions"
        A[Ask Educational Query]
        B[Upload Documents]
        C[Change Language]
        D[View College Info]
        E[Get Exam Details]
        F[Search Scholarships]
    end
    
    subgraph "System Actions"
        G[Process Query]
        H[Translate Content]
        I[Search Database]
        J[Format Response]
    end
    
    A --> G
    B --> G
    C --> H
    D --> I
    E --> I
    F --> I
    G --> J
    H --> J
```

## 5. Problem Definition and Scope

### 5.1 Problem Definition
The Educational Assistant Chatbot addresses the challenge of providing accessible, multilingual educational guidance to students in India. It offers information about:
- College and university details
- Entrance examination guidance
- Scholarship opportunities
- Admission processes
- General educational queries

### 5.2 Modules
1. **Query Processing Module**
   - Natural language understanding
   - Query classification
   - Response generation

2. **Translation Module**
   - Language detection
   - Multi-language support
   - Real-time translation

3. **Data Management Module**
   - Educational database
   - College information
   - Exam details
   - Scholarship data

4. **User Interface Module**
   - React-based frontend
   - Responsive design
   - Accessibility features

### 5.3 Project Scope
- **Geographic Coverage**: Pan-India with detailed focus on Maharashtra
- **Language Support**: 10 major Indian languages
- **Information Domains**:
  - Higher Education
  - Professional Courses
  - Entrance Exams
  - Scholarships
  - Career Guidance

## 6. Technical Details

### 6.1 Technology Stack
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Flask (Python)
- **Database**: JSON-based data store
- **APIs**: Google Translate, Custom Search

### 6.2 Algorithms

#### Query Processing Algorithm
```python
1. Input: User query (text)
2. Detect language if not specified
3. Translate to English if needed
4. Classify query type:
   - College-related
   - Exam-related
   - Scholarship-related
   - General
5. Process query based on type
6. Format response
7. Translate response to user's language
8. Return formatted response
```

#### Search Algorithm
```python
1. Input: Processed query
2. Extract keywords and entities
3. Match against database:
   - Direct matches
   - Fuzzy matches
   - Semantic similarity
4. Rank results by relevance
5. Return top N matches
```

### 6.3 Performance Considerations
- Response time: < 2 seconds
- Translation accuracy: > 95%
- Query understanding: > 90%
- Scalability: Up to 1000 concurrent users 
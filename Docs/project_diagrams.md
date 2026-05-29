# Project Diagrams Collection

## System Architecture Diagrams

### Version 1: Basic Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        UI["📱 React UI"]
        I18N["🌐 i18n"]
        State["⚡ Redux"]
    end
    subgraph "API Layer"
        API["⚙️ Flask"]
        Auth["🔐 JWT"]
        Cache["💾 Redis"]
    end
    subgraph "Processing"
        NLP["🧠 NLP"]
        ML["🤖 ML"]
    end
    subgraph "Data"
        DB["💾 DB"]
    end
    UI --> API --> NLP --> DB
```

### Version 2: Detailed Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        UI["📱 React UI Components<br/>Material UI, TailwindCSS"]
        I18N["🌐 Internationalization<br/>10 Languages"]
        State["⚡ State Management<br/>Redux"]
        Router["🔄 Router<br/>React Router"]
    end
    subgraph "API Layer"
        API["⚙️ Flask API Server"]
        Auth["🔐 Authentication"]
        Cache["💾 Response Cache"]
        Rate["⚡ Rate Limiter"]
    end
    subgraph "Processing Layer"
        NLP["🤖 NLP Engine"]
        Trans["🔄 Translation"]
        Search["🔍 Search"]
        ML["📊 ML Models"]
    end
    subgraph "Data Layer"
        ED["📚 Educational Data"]
        CD["🏫 College Database"]
        CH["💬 Chat History"]
        FS["📁 File Storage"]
    end
    UI --> API --> NLP --> ED
```

## Data Flow Diagrams

### Version 1: Basic DFD
```mermaid
graph TB
    User((User))
    System((System))
    DB[(Database)]
    User -->|Query| System
    System -->|Response| User
    System <-->|Data| DB
```

### Version 2: Detailed DFD
```mermaid
graph TB
    User((User))
    subgraph "Interface"
        Web["💻 Web"]
        Mobile["📱 Mobile"]
        Voice["🎤 Voice"]
    end
    subgraph "Processing"
        NLP["🧠 NLP"]
        ML["🤖 ML"]
        Search["🔍 Search"]
    end
    subgraph "Storage"
        Cache["💾 Cache"]
        DB["🗄️ Database"]
        Files["📁 Files"]
    end
    User --> Web & Mobile & Voice
    Web & Mobile & Voice --> NLP
    NLP --> ML --> Search
    Search --> Cache --> DB
```

## Sequence Diagrams

### Version 1: Basic Flow
```mermaid
sequenceDiagram
    User->>Interface: Query
    Interface->>API: Request
    API->>Database: Fetch
    Database-->>API: Data
    API-->>Interface: Response
    Interface-->>User: Display
```

### Version 2: Detailed Flow
```mermaid
sequenceDiagram
    participant U as User
    participant I as Interface
    participant A as API
    participant N as NLP
    participant T as Translator
    participant D as Database
    
    U->>I: Submit Query
    I->>A: Send Request
    A->>N: Process Query
    N->>T: Translate if needed
    T-->>N: Translated Text
    N->>D: Fetch Data
    D-->>N: Return Results
    N->>T: Translate Response
    T-->>A: Final Response
    A-->>I: Send Response
    I-->>U: Display Result
```

## Class Diagrams

### Version 1: Core Classes
```mermaid
classDiagram
    class ChatSystem {
        -history: List
        +processQuery()
        +getResponse()
    }
    class QueryProcessor {
        +analyze()
        +classify()
    }
    ChatSystem --> QueryProcessor
```

### Version 2: Detailed Classes
```mermaid
classDiagram
    class ChatSystem {
        -conversation_history: List
        -language_support: Dict
        -max_history_size: int
        +process_query(query: str)
        +translate_response(text: str)
        +clear_history()
    }
    class QueryProcessor {
        -nlp_engine: NLPEngine
        -classifier: Classifier
        +process_query(query: str)
        -classify_query(query: str)
    }
    class DataManager {
        -education_data: Dict
        -college_data: Dict
        +get_college_info()
        +get_exam_info()
    }
    ChatSystem --> QueryProcessor
    ChatSystem --> DataManager
```

## Activity Diagrams

### Version 1: Basic Flow
```mermaid
graph TB
    A[Start] --> B{Input Type}
    B -->|Text| C[Process Text]
    B -->|Voice| D[Convert to Text]
    C & D --> E[Generate Response]
    E --> F[End]
```

### Version 2: Detailed Flow
```mermaid
graph TB
    Start((Start))
    Input[User Input]
    Lang{Language Check}
    Trans[Translate]
    Process[Process Query]
    Type{Query Type}
    College[College Info]
    Exam[Exam Info]
    Scholar[Scholarship]
    Response[Generate Response]
    End((End))
    
    Start --> Input
    Input --> Lang
    Lang -->|Non-English| Trans
    Lang -->|English| Process
    Trans --> Process
    Process --> Type
    Type -->|College| College
    Type -->|Exam| Exam
    Type -->|Scholarship| Scholar
    College & Exam & Scholar --> Response
    Response --> End
```

## Use Case Diagrams

### Version 1: Basic Use Cases
```mermaid
graph TB
    User((User))
    Query[Ask Query]
    View[View Info]
    Lang[Change Language]
    
    User --> Query
    User --> View
    User --> Lang
```

### Version 2: Detailed Use Cases
```mermaid
graph TB
    User((User))
    subgraph "Query Actions"
        Ask[Ask Educational Query]
        Upload[Upload Documents]
        Change[Change Language]
    end
    subgraph "View Actions"
        College[View College Info]
        Exam[Get Exam Details]
        Scholar[Search Scholarships]
    end
    User --> Ask & Upload & Change
    User --> College & Exam & Scholar
```

[Additional diagrams can be added based on project needs] 
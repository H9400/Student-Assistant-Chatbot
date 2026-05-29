[Continued from previous section...]

### 5.5 Activity Diagram

```mermaid
graph TB
    Start((Start)) --> A[User Submits Query]
    A --> B{Language Detection}
    B -->|Non-English| C[Translate to English]
    B -->|English| D[Process Query]
    C --> D
    D --> E{Query Type}
    
    E -->|College| F[Process College Query]
    E -->|Exam| G[Process Exam Query]
    E -->|Scholarship| H[Process Scholarship Query]
    
    F & G & H --> I[Generate Response]
    I --> J{Original Language}
    J -->|Non-English| K[Translate Response]
    J -->|English| L[Format Response]
    K --> L
    L --> End((End))
    
    style Start fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
    style End fill:#ffcccb,stroke:#ff6b6b,stroke-width:2px
```

### 5.6 Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Interface
    participant API as API Server
    participant NLP as NLP Engine
    participant DB as Database
    participant TR as Translator

    U->>UI: Submit Query
    UI->>API: Send Request
    API->>NLP: Process Query
    
    alt Non-English Query
        NLP->>TR: Translate Query
        TR-->>NLP: English Query
    end
    
    NLP->>DB: Fetch Data
    DB-->>NLP: Return Results
    NLP->>TR: Translate Response
    TR-->>API: Translated Content
    API-->>UI: Send Response
    UI-->>U: Display Result
```

### 5.7 Class Diagram

```mermaid
classDiagram
    class User {
        +String userId
        +String username
        +String email
        +List preferences
        +createQuery()
        +viewResponse()
    }

    class Query {
        +String queryId
        +String content
        +String language
        +Timestamp timestamp
        +process()
        +translate()
    }

    class Response {
        +String responseId
        +String content
        +String type
        +List attachments
        +format()
        +validate()
    }

    class ChatSession {
        +String sessionId
        +User user
        +List messages
        +Timestamp startTime
        +manage()
        +archive()
    }

    User "1" -- "*" Query
    Query "1" -- "1" Response
    User "1" -- "*" ChatSession
    ChatSession "1" -- "*" Query
```

### 5.8 Flowchart Diagram

```mermaid
graph TB
    A[Start] --> B{User Input}
    B -->|Text| C[Text Processing]
    B -->|Voice| D[Speech-to-Text]
    B -->|Document| E[Document Analysis]
    
    C & D & E --> F[Language Detection]
    F --> G{English?}
    G -->|Yes| H[Query Processing]
    G -->|No| I[Translation]
    I --> H
    
    H --> J{Query Type}
    J -->|College| K[College DB Search]
    J -->|Exam| L[Exam DB Search]
    J -->|Scholarship| M[Scholarship Search]
    
    K & L & M --> N[Response Generation]
    N --> O{Original Language}
    O -->|English| P[Format Response]
    O -->|Non-English| Q[Translate Response]
    Q --> P
    P --> R[End]
    
    style A fill:#c2f0c2,stroke:#4caf50,stroke-width:2px
    style R fill:#ffcccb,stroke:#ff6b6b,stroke-width:2px
```

### 5.9 Mathematical Model

#### 5.9.1 Set Theory
```
Let S be the System:
S = {I, P, O, F, Su, Fa}

Where:
I = Input Set = {q, l, t}
q = Query content
l = Language preference
t = Query type

P = Process Set = {p1, p2, p3, p4}
p1 = Language detection
p2 = Query processing
p3 = Database search
p4 = Response generation

O = Output Set = {r, c, s}
r = Response content
c = Confidence score
s = Status code

F = Functions = {f1, f2, f3}
f1 = Language detection function
f2 = Query processing function
f3 = Response generation function

Su = Success cases = {valid query, supported language}
Fa = Failure cases = {invalid query, unsupported language}
```

#### 5.9.2 Query Processing Model
```
Query Processing Function Q(x):
Q(x) = T(N(x))

Where:
T = Translation function
N = NLP processing function

N(x) = {E(x), I(x), C(x)}
E = Entity extraction
I = Intent classification
C = Context analysis

Confidence Score C(x):
C(x) = w1*E(x) + w2*I(x) + w3*M(x)

Where:
w1, w2, w3 = Weights
M = Pattern matching score
```

#### 5.9.3 Performance Model
```
Response Time R:
R = Rp + Rt + Rd

Where:
Rp = Processing time
Rt = Translation time
Rd = Database access time

System Load L:
L = (n*q)/(t*c)

Where:
n = Number of concurrent users
q = Queries per user
t = Time period
c = System capacity
```

[Continued in next section...] 
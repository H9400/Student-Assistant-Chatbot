# UI Components Documentation

## Data Visualization Components

The data visualization components provide a comprehensive set of tools for displaying data in various chart formats, built using Recharts library and styled-components.

### Chart Components
```typescript
interface ChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  theme: Theme;
}

// Line Chart Component
export const LineChartComponent = styled(({ data, theme }) => (
  <ResponsiveContainer>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke={theme.colors.primary} />
    </LineChart>
  </ResponsiveContainer>
))``;

// Chart Container
export const ChartCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
`;

// Usage Example
const ProgressChart: React.FC = () => {
  const data = [
    { name: 'Week 1', value: 30 },
    { name: 'Week 2', value: 45 },
    { name: 'Week 3', value: 60 },
    { name: 'Week 4', value: 80 }
  ];

  return (
    <ChartCard>
      <h3>Learning Progress</h3>
      <LineChartComponent data={data} height={300} />
    </ChartCard>
  );
};
```

## Notification System

The notification system provides toast notifications and alerts for user feedback.

### Toast Notifications
```typescript
interface NotificationProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  theme: Theme;
  duration?: number;
  onClose?: () => void;
}

export const NotificationContainer = styled.div`
  position: fixed;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 1000;
`;

export const NotificationItem = styled.div<NotificationProps>`
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.lg};
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Notification Manager
export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const show = (notification: NotificationProps) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, notification.duration || 5000);
    }
  };

  const dismiss = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, show, dismiss };
};

// Usage Example
const App: React.FC = () => {
  const { notifications, show } = useNotification();

  const handleSuccess = () => {
    show({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
      duration: 3000
    });
  };

  return (
    <>
      <button onClick={handleSuccess}>Show Notification</button>
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} {...notification} />
        ))}
      </NotificationContainer>
    </>
  );
};
```

## File Upload Components

File upload components support drag-and-drop functionality and file preview.

### Upload Container
```typescript
interface FileUploadProps {
  isDragActive?: boolean;
  error?: boolean;
  accept?: string;
  maxSize?: number;
  onUpload: (files: File[]) => void;
  onError: (error: string) => void;
}

export const FileUploadContainer = styled.div<FileUploadProps>`
  border: 2px dashed ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

export const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
`;

// File Upload Hook
export const useFileUpload = (options: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    try {
      const validFiles = acceptedFiles.filter(file => {
        if (options.maxSize && file.size > options.maxSize) {
          options.onError(`File ${file.name} is too large`);
          return false;
        }
        return true;
      });

      setFiles(validFiles);
      await options.onUpload(validFiles);
    } catch (error) {
      options.onError(error.message);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { files, loading, handleDrop };
};

// Usage Example
const FileUploader: React.FC = () => {
  const { files, loading, handleDrop } = useFileUpload({
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    onUpload: async (files) => {
      // Handle file upload
    },
    onError: (error) => {
      // Handle error
    }
  });

  return (
    <FileUploadContainer>
      <input type="file" onChange={e => handleDrop(Array.from(e.target.files))} />
      {loading && <p>Uploading...</p>}
      {files.map(file => (
        <FilePreview key={file.name}>
          <span>{file.name}</span>
          <span>{Math.round(file.size / 1024)}KB</span>
        </FilePreview>
      ))}
    </FileUploadContainer>
  );
};
```

## Authentication Components

Authentication components for login, registration, and user management.

### Auth Forms
```typescript
interface AuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const AuthCard = styled(Card)`
  max-width: 400px;
  width: 100%;
  margin: ${props => props.theme.spacing.xl} auto;
`;

export const AuthForm = styled(Form)`
  .auth-title {
    text-align: center;
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

// Form Validation Hook
export const useAuthForm = (schema: any) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema)
  });

  return { register, handleSubmit, errors, reset };
};

// Usage Example
const LoginForm: React.FC<AuthFormProps> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, errors } = useAuthForm(loginSchema);

  return (
    <AuthCard>
      <AuthForm onSubmit={handleSubmit(onSubmit)}>
        <h2 className="auth-title">Login</h2>
        <Input
          {...register('email')}
          type="email"
          placeholder="Email"
          error={errors.email?.message}
        />
        <Input
          {...register('password')}
          type="password"
          placeholder="Password"
          error={errors.password?.message}
        />
        <Button type="submit" loading={loading}>
          Login
        </Button>
      </AuthForm>
    </AuthCard>
  );
};
```

## Search Components

Search functionality with autocomplete and results display.

### Search Interface
```typescript
interface SearchProps {
  onSearch: (query: string) => Promise<any[]>;
  onSelect: (item: any) => void;
  debounceTime?: number;
}

export const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  max-height: 300px;
  overflow-y: auto;
`;

// Search Hook
export const useSearch = ({ onSearch, debounceTime = 300 }: SearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query) {
        setLoading(true);
        try {
          const data = await onSearch(query);
          setResults(data);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [query, onSearch, debounceTime]);

  return { query, setQuery, results, loading };
};

// Usage Example
const SearchBar: React.FC<SearchProps> = ({ onSearch, onSelect }) => {
  const { query, setQuery, results, loading } = useSearch({ onSearch });

  return (
    <SearchContainer>
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <Spinner />}
      {results.length > 0 && (
        <SearchResults>
          {results.map(item => (
            <div key={item.id} onClick={() => onSelect(item)}>
              {item.title}
            </div>
          ))}
        </SearchResults>
      )}
    </SearchContainer>
  );
};
``` 
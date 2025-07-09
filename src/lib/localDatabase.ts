// Local Database Implementation using IndexedDB
interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface KYCApplication {
  id: string;
  userId: string;
  applicationNumber: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  currentStep: number;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  documentInfo?: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    frontImage?: string;
    backImage?: string;
  };
  facialVerification?: {
    isCompleted: boolean;
    confidence: number;
    matchScore: number;
    livenessCheck: boolean;
  };
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

class LocalDatabase {
  private dbName = 'KYCDatabase';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // KYC Applications store
        if (!db.objectStoreNames.contains('applications')) {
          const appStore = db.createObjectStore('applications', { keyPath: 'id' });
          appStore.createIndex('userId', 'userId');
          appStore.createIndex('status', 'status');
          appStore.createIndex('applicationNumber', 'applicationNumber', { unique: true });
        }

        // Audit logs store
        if (!db.objectStoreNames.contains('auditLogs')) {
          const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
          auditStore.createIndex('userId', 'userId');
          auditStore.createIndex('applicationId', 'applicationId');
          auditStore.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.add(user);

      request.onsuccess = () => resolve(user);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');

    const updatedUser = { ...user, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(updatedUser);

      request.onsuccess = () => resolve(updatedUser);
      request.onerror = () => reject(request.error);
    });
  }

  // KYC Application operations
  async createApplication(appData: Omit<KYCApplication, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt'>): Promise<KYCApplication> {
    const application: KYCApplication = {
      ...appData,
      id: this.generateId(),
      applicationNumber: `KYC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readwrite');
      const store = transaction.objectStore('applications');
      const request = store.add(application);

      request.onsuccess = () => resolve(application);
      request.onerror = () => reject(request.error);
    });
  }

  async updateApplication(id: string, updates: Partial<KYCApplication>): Promise<KYCApplication> {
    const app = await this.getApplicationById(id);
    if (!app) throw new Error('Application not found');

    const updatedApp = { 
      ...app, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readwrite');
      const store = transaction.objectStore('applications');
      const request = store.put(updatedApp);

      request.onsuccess = () => resolve(updatedApp);
      request.onerror = () => reject(request.error);
    });
  }

  async getApplicationById(id: string): Promise<KYCApplication | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readonly');
      const store = transaction.objectStore('applications');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserApplications(userId: string): Promise<KYCApplication[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readonly');
      const store = transaction.objectStore('applications');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllApplications(): Promise<KYCApplication[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readonly');
      const store = transaction.objectStore('applications');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getApplicationsByStatus(status: string): Promise<KYCApplication[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['applications'], 'readonly');
      const store = transaction.objectStore('applications');
      const index = store.index('status');
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Audit log operations
  async createAuditLog(logData: {
    userId?: string;
    applicationId?: string;
    action: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const log = {
      id: this.generateId(),
      ...logData,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['auditLogs'], 'readwrite');
      const store = transaction.objectStore('auditLogs');
      const request = store.add(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // File storage using base64
  async storeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

export const localDB = new LocalDatabase();
export type { User, KYCApplication };
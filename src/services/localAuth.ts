import { localDB, User } from '../lib/localDatabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

class LocalAuthService {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  async init() {
    await localDB.init();
    
    // Create default admin user if none exists
    const adminUser = await localDB.getUserByEmail('admin@kyc.com');
    if (!adminUser) {
      await localDB.createUser({
        email: 'admin@kyc.com',
        password: this.hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        isAdmin: true,
      });
    }

    // Check for stored session
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.currentUser = await localDB.getUserById(storedUserId);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    const user = await localDB.getUserByEmail(credentials.email);
    
    if (!user || user.password !== this.hashPassword(credentials.password)) {
      await localDB.createAuditLog({
        action: 'LOGIN_FAILED',
        details: { email: credentials.email, error: 'Invalid credentials' }
      });
      throw new Error('Invalid email or password');
    }

    // Update last login
    await localDB.updateUser(user.id, { lastLogin: new Date().toISOString() });
    
    this.currentUser = user;
    localStorage.setItem('currentUserId', user.id);
    
    await localDB.createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      details: { email: credentials.email }
    });

    this.notifyAuthListeners();
    return { user };
  }

  async register(userData: RegisterData): Promise<{ user: User }> {
    // Check if user already exists
    const existingUser = await localDB.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const user = await localDB.createUser({
      ...userData,
      password: this.hashPassword(userData.password),
      isAdmin: false,
    });

    await localDB.createAuditLog({
      userId: user.id,
      action: 'REGISTER_SUCCESS',
      details: { email: userData.email }
    });

    return { user };
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      await localDB.createAuditLog({
        userId: this.currentUser.id,
        action: 'LOGOUT',
        details: {}
      });
    }

    this.currentUser = null;
    localStorage.removeItem('currentUserId');
    this.notifyAuthListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.authListeners.push(callback);
    return {
      unsubscribe: () => {
        const index = this.authListeners.indexOf(callback);
        if (index > -1) {
          this.authListeners.splice(index, 1);
        }
      }
    };
  }

  private notifyAuthListeners() {
    this.authListeners.forEach(callback => callback(this.currentUser));
  }

  private hashPassword(password: string): string {
    // Simple hash function for demo - in production use proper hashing
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async resetPassword(email: string): Promise<void> {
    const user = await localDB.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    await localDB.createAuditLog({
      action: 'PASSWORD_RESET_REQUEST',
      details: { email }
    });

    // In a real app, you would send an email here
    console.log('Password reset requested for:', email);
  }
}

export const localAuthService = new LocalAuthService();
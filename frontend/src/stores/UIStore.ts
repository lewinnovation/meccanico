import { makeAutoObservable } from 'mobx';
import type { RootStore } from './RootStore';

export class UIStore {
  rootStore: RootStore;
  sidebarOpen = true;
  commandPaletteOpen = false;
  activeModal: string | null = null;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }> = [];

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (this.commandPaletteOpen) {
          this.closeCommandPalette();
        } else if (this.activeModal) {
          this.closeModal();
        }
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleCommandPalette(): void {
    this.commandPaletteOpen = !this.commandPaletteOpen;
  }

  closeCommandPalette(): void {
    this.commandPaletteOpen = false;
  }

  openModal(modalId: string): void {
    this.activeModal = modalId;
  }

  closeModal(): void {
    this.activeModal = null;
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Date.now().toString();
    this.toasts.push({ id, message, type });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}


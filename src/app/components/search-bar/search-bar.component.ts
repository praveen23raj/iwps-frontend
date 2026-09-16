import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ClaudeService } from 'src/app/services/claude.service';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  prompt: string = '';
  imageMode: boolean = false;
  isMenuOpen: boolean = false;
  isLoading: boolean = false;

  @Output() messageEvent = new EventEmitter<any>();

  constructor(
    private claude: ClaudeService,
    private imageService: ImageService,
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectMode(mode: 'chat' | 'image'): void {
    this.imageMode = mode === 'image';
    this.isMenuOpen = false;
    this.focusInput();
  }

  toggleImageMode(): void {
    this.imageMode = !this.imageMode;
    this.focusInput();
  }

  get placeholderText(): string {
    return this.imageMode
      ? 'Describe the image you want to generate...'
      : 'Ask anything...';
  }

  autoResize(textarea: HTMLTextAreaElement): void {
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 140;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  }

  handleEnter(event: Event, textarea: HTMLTextAreaElement): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key !== 'Enter') {
      return;
    }

    if (keyboardEvent.shiftKey) {
      return;
    }

    keyboardEvent.preventDefault();
    this.askClaude();
  }

  askClaude(): void {
    const question = this.prompt.trim();
    if (!question || this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Dispatch user message bubble immediately
    this.messageEvent.emit({
      role: 'user',
      type: 'text',
      content: question
    });

    this.prompt = '';
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.style.height = '24px';
    }

    // ==========================================
    // IMAGE GENERATION MODE
    // ==========================================
    if (this.imageMode) {
      this.imageService.generateImage(question)
        .pipe(finalize(() => { this.isLoading = false; }))
        .subscribe({
          next: (res: any) => {
            const base64 = res?.steps?.[0]?.content?.[0]?.data;

            if (!base64) {
              this.messageEvent.emit({
                role: 'assistant',
                type: 'text',
                content: 'Image was generated, but no visual payload returned.'
              });
              return;
            }

            this.messageEvent.emit({
              role: 'assistant',
              type: 'image',
              content: base64
            });
          },
          error: (err: any) => {
            const backendError =
              err?.error?.error ||
              err?.error?.message ||
              err?.message ||
              'Image generation is currently unavailable.';

            this.messageEvent.emit({
              role: 'assistant',
              type: 'text',
              content: backendError
            });
          }
        });
      return;
    }

    // ==========================================
    // NORMAL CHAT MODE
    // ==========================================
    this.claude.chat(question)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (res: any) => {
          this.messageEvent.emit({
            role: 'assistant',
            type: 'text',
            content: res
          });
        },
        error: () => {
          this.messageEvent.emit({
            role: 'assistant',
            type: 'text',
            content: 'AI agent is currently unavailable.'
          });
        }
      });
  }

  private focusInput(): void {
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 50);
  }
}
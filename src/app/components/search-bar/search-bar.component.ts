import { Component, EventEmitter, Output } from '@angular/core';
import { ClaudeService } from 'src/app/services/claude.service';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {

  prompt = '';

  // false = Claude
  // true = Image generation
  imageMode = false;

  @Output()
  messageEvent = new EventEmitter<any>();


  constructor(
    private claude: ClaudeService,
    private imageService: ImageService
  ) { }


  /*
   * Toggle image generation mode
   */
  toggleImageMode() {
    this.imageMode = !this.imageMode;
  }


  /*
   * Handle Enter key
   *
   * Enter       -> Send
   * Shift+Enter -> New line
   */
  handleEnter(
    event: Event,
    textarea: HTMLTextAreaElement
  ) {
    const keyboardEvent = event as KeyboardEvent;

    // Shift + Enter = new line
    if (keyboardEvent.shiftKey) {
      return;
    }

    event.preventDefault();

    this.askClaude();

    // Reset textarea height after sending
    setTimeout(() => {
      textarea.style.height = '40px';
    });
  }




  /*
   * Automatically expand the textarea
   * as the user types.
   */
  autoResize(textarea: HTMLTextAreaElement) {

    // Reset height first so shrinking works too
    textarea.style.height = 'auto';

    // Calculate required height
    const newHeight = textarea.scrollHeight;

    // Keep it within our maximum height
    const maxHeight = 170;

    textarea.style.height =
      Math.min(newHeight, maxHeight) + 'px';
  }


  /*
   * Send message
   */
  askClaude() {

    if (!this.prompt.trim()) {
      return;
    }

    const question = this.prompt.trim();


    // ==========================================
    // SHOW USER MESSAGE IMMEDIATELY
    // ==========================================

    this.messageEvent.emit({
      role: 'user',
      type: 'text',
      content: question
    });


    // Clear input
    this.prompt = '';


    // ==========================================
    // IMAGE GENERATION MODE
    // ==========================================

    if (this.imageMode) {

      this.imageService.generateImage(question).subscribe({

        next: (res) => {

          console.log(
            'OpenAI image response:',
            res
          );


          // Get Base64 image from backend response
          const base64 =
            res?.steps?.[0]?.content?.[0]?.data;


          if (!base64) {

            console.error(
              'No Base64 image found in response'
            );


            this.messageEvent.emit({
              role: 'assistant',
              type: 'text',
              content:
                'Image was generated, but no image data was returned.'
            });

            return;
          }


          // Send image to HomeComponent
          this.messageEvent.emit({
            role: 'assistant',
            type: 'image',
            content: base64
          });

        },


        error: (err) => {

          console.error(
            'Image generation error:',
            err
          );


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
    // NORMAL CLAUDE MODE
    // ==========================================

    this.claude.chat(question).subscribe({

      next: (res) => {

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
          content:
            'AI agent is currently unavailable.'
        });

      }

    });

  }

}

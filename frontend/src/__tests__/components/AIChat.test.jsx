import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';
import AIChat from '../../components/AIAssistant/AIChat';

// Mock des dépendances
jest.mock('axios');
jest.mock('../../services/api', () => ({
  chatWithAI: jest.fn(),
  getUsageStats: jest.fn(),
  getSuggestions: jest.fn(),
  rateResponse: jest.fn(),
}));

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

const renderWithQueryClient = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AIChat Component', () => {
  const mockAPI = require('../../services/api');
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Configuration par défaut des mocks
    mockAPI.getUsageStats.mockResolvedValue({
      data: {
        available: true,
        usage: 50,
        limit: 500,
        remaining: 450,
        percentage_used: 10,
      }
    });

    mockAPI.getSuggestions.mockResolvedValue({
      data: {
        suggestions: [
          { text: 'Comment améliorer la gouvernance OHADA ?', category: 'governance' },
          { text: 'Quels rapports UEMOA dois-je produire ?', category: 'compliance' },
        ]
      }
    });
  });

  test('renders AI chat interface correctly', () => {
    renderWithQueryClient(<AIChat />);
    
    expect(screen.getByText('Assistant IA Expert EPE')).toBeInTheDocument();
    expect(screen.getByText('Bonjour ! Je suis votre assistant IA spécialisé en gouvernance EPE.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeInTheDocument();
  });

  test('displays initial suggestions', async () => {
    renderWithQueryClient(<AIChat />);
    
    await waitFor(() => {
      expect(screen.getByText('Questions suggérées pour commencer :')).toBeInTheDocument();
    });

    expect(screen.getByText('Comment améliorer la gouvernance OHADA ?')).toBeInTheDocument();
    expect(screen.getByText('Quels rapports UEMOA dois-je produire ?')).toBeInTheDocument();
  });

  test('displays usage statistics', async () => {
    renderWithQueryClient(<AIChat />);
    
    await waitFor(() => {
      expect(screen.getByText('Utilisation IA :')).toBeInTheDocument();
    });

    expect(screen.getByText('50/500')).toBeInTheDocument();
  });

  test('sends message when user types and clicks send', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Voici mes recommandations pour améliorer votre gouvernance OHADA...',
        conversation_id: 'conv_123',
        suggestions: ['Question suivante ?'],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Comment améliorer ma gouvernance ?');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockAPI.chatWithAI).toHaveBeenCalledWith({
        message: 'Comment améliorer ma gouvernance ?',
        conversation_id: null,
      });
    });

    expect(screen.getByText('Comment améliorer ma gouvernance ?')).toBeInTheDocument();
    expect(screen.getByText(/Voici mes recommandations pour améliorer votre gouvernance OHADA/)).toBeInTheDocument();
  });

  test('sends message when user presses Enter', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Réponse test',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);

    await user.type(input, 'Test question{enter}');

    await waitFor(() => {
      expect(mockAPI.chatWithAI).toHaveBeenCalledWith({
        message: 'Test question',
        conversation_id: null,
      });
    });
  });

  test('does not send empty messages', async () => {
    renderWithQueryClient(<AIChat />);
    
    const sendButton = screen.getByRole('button', { name: /envoyer/i });
    await user.click(sendButton);

    expect(mockAPI.chatWithAI).not.toHaveBeenCalled();
  });

  test('shows loading state while sending message', async () => {
    let resolvePromise;
    mockAPI.chatWithAI.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Test question');
    await user.click(sendButton);

    expect(screen.getByText('L\'assistant réfléchit...')).toBeInTheDocument();
    expect(sendButton).toBeDisabled();

    // Résoudre la promesse
    resolvePromise({
      data: {
        success: true,
        message: 'Réponse test',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('L\'assistant réfléchit...')).not.toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: false,
        error: {
          message: 'Limite d\'utilisation atteinte',
          code: 'subscription_limit_exceeded',
        }
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Test question');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Limite d\'utilisation atteinte')).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    mockAPI.chatWithAI.mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    await user.type(input, 'Test question');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Impossible de se connecter à l'assistant IA/)).toBeInTheDocument();
    });
  });

  test('clicking suggestion sends message', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Réponse à la suggestion',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);

    await waitFor(() => {
      expect(screen.getByText('Comment améliorer la gouvernance OHADA ?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Comment améliorer la gouvernance OHADA ?'));

    await waitFor(() => {
      expect(mockAPI.chatWithAI).toHaveBeenCalledWith({
        message: 'Comment améliorer la gouvernance OHADA ?',
        conversation_id: null,
      });
    });
  });

  test('displays message suggestions after AI response', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Voici ma réponse',
        conversation_id: 'conv_123',
        suggestions: [
          'Question de suivi 1',
          'Question de suivi 2',
        ],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test question{enter}');

    await waitFor(() => {
      expect(screen.getByText('Questions suggérées :')).toBeInTheDocument();
      expect(screen.getByText('Question de suivi 1')).toBeInTheDocument();
      expect(screen.getByText('Question de suivi 2')).toBeInTheDocument();
    });
  });

  test('shows copy button for AI responses', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Message à copier',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByTitle('Copier')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Copier'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Message à copier');
  });

  test('shows rating button for AI responses', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Message à évaluer',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByTitle('Évaluer cette réponse')).toBeInTheDocument();
    });
  });

  test('opens rating modal when rating button is clicked', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Message à évaluer',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByTitle('Évaluer cette réponse')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Évaluer cette réponse'));

    expect(screen.getByText('Évaluer cette réponse')).toBeInTheDocument();
    expect(screen.getByText('Note globale :')).toBeInTheDocument();
  });

  test('submits rating successfully', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Message à évaluer',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    mockAPI.rateResponse.mockResolvedValue({
      data: { success: true, message: 'Merci pour votre évaluation !' }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByTitle('Évaluer cette réponse')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Évaluer cette réponse'));

    // Sélectionner 5 étoiles
    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]); // 5ème étoile

    // Ajouter un commentaire
    const commentTextarea = screen.getByPlaceholderText(/Que pensez-vous de cette réponse/);
    await user.type(commentTextarea, 'Excellente réponse !');

    // Soumettre
    await user.click(screen.getByText('Envoyer l\'évaluation'));

    await waitFor(() => {
      expect(mockAPI.rateResponse).toHaveBeenCalledWith({
        conversation_id: 'conv_123',
        message_index: 0,
        rating: 5,
        feedback: 'Excellente réponse !',
      });
    });
  });

  test('disables input when usage limit is reached', () => {
    mockAPI.getUsageStats.mockResolvedValue({
      data: {
        available: false,
        usage: 500,
        limit: 500,
        remaining: 0,
        percentage_used: 100,
      }
    });

    renderWithQueryClient(<AIChat />);

    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    const sendButton = screen.getByRole('button', { name: /envoyer/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(screen.getByText(/Limite d'utilisation atteinte/)).toBeInTheDocument();
  });

  test('auto-scrolls to bottom when new messages are added', async () => {
    // Mock scrollIntoView
    const mockScrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Nouvelle réponse',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  test('shows provider information in messages', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Message avec provider info',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
        tokens_used: 150,
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    await user.type(input, 'Test{enter}');

    await waitFor(() => {
      expect(screen.getByText('OPENAI')).toBeInTheDocument();
      expect(screen.getByText('150 tokens')).toBeInTheDocument();
    });
  });

  test('handles multiline input correctly', async () => {
    mockAPI.chatWithAI.mockResolvedValue({
      data: {
        success: true,
        message: 'Réponse à message multiline',
        conversation_id: 'conv_123',
        suggestions: [],
        provider: 'openai',
      }
    });

    renderWithQueryClient(<AIChat />);
    
    const input = screen.getByPlaceholderText(/Posez votre question sur la gouvernance EPE/);
    
    // Taper un message multiline avec Shift+Enter
    await user.type(input, 'Ligne 1{shift}{enter}Ligne 2');
    
    expect(input.value).toBe('Ligne 1\nLigne 2');

    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => {
      expect(mockAPI.chatWithAI).toHaveBeenCalledWith({
        message: 'Ligne 1\nLigne 2',
        conversation_id: null,
      });
    });
  });
});
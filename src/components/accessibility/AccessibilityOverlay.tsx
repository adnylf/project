"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Contrast, 
  MousePointer, 
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Focus,
  Palette,
  Power,
  PowerOff,
  Accessibility,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Text,
  Monitor,
  Navigation,
  Gauge,
  User,
  Volume,
  Move,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AccessibilitySettings {
  enabled: boolean;
  fontSize: number;
  contrast: 'normal' | 'high' | 'higher';
  brightness: number;
  saturation: number;
  invertColors: boolean;
  grayscale: boolean;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  cursorSize: 'normal' | 'large' | 'extra';
  readingGuide: boolean;
  focusMode: boolean;
  soundEnabled: boolean;
  textToSpeech: boolean;
  ttsRate: number;
  ttsVolume: number;
  ttsVoice: string;
  widgetPosition: 'left' | 'right';
}

interface SettingButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'success' | 'danger';
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  displayValue?: string;
}

const AccessibilityOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('visual');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTTSActive, setIsTTSActive] = useState<boolean>(false);
  
  // Refs
  const ttsEnabledRef = useRef<boolean>(false);
  const mouseEnterHandlerRef = useRef<((e: Event) => void) | null>(null);
  const mouseLeaveHandlerRef = useRef<((e: Event) => void) | null>(null);
  
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const defaultSettings: AccessibilitySettings = {
      enabled: false,
      fontSize: 100,
      contrast: 'normal',
      brightness: 100,
      saturation: 100,
      invertColors: false,
      grayscale: false,
      lineHeight: 100,
      letterSpacing: 0,
      fontWeight: 400,
      textAlign: 'left',
      cursorSize: 'normal',
      readingGuide: false,
      focusMode: false,
      soundEnabled: true,
      textToSpeech: false,
      ttsRate: 1.0,
      ttsVolume: 0.8,
      ttsVoice: '',
      widgetPosition: 'right'
    };

    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('accessibility-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          return { 
            ...defaultSettings, 
            ...parsed,
            ttsRate: parsed.ttsRate !== undefined ? parsed.ttsRate : defaultSettings.ttsRate,
            ttsVolume: parsed.ttsVolume !== undefined ? parsed.ttsVolume : defaultSettings.ttsVolume,
            ttsVoice: parsed.ttsVoice !== undefined ? parsed.ttsVoice : defaultSettings.ttsVoice,
            widgetPosition: parsed.widgetPosition || defaultSettings.widgetPosition
          };
        }
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }

    return defaultSettings;
  });

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice if not set
      if (voices.length > 0 && !settings.ttsVoice) {
        const defaultVoice = voices.find(voice => voice.lang.includes('id')) || 
                           voices.find(voice => voice.lang.includes('en')) || 
                           voices[0];
        if (defaultVoice) {
          setSettings(prev => ({
            ...prev,
            ttsVoice: defaultVoice.voiceURI
          }));
        }
      }
    };

    loadVoices();
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Update TTS enabled ref
  useEffect(() => {
    ttsEnabledRef.current = settings.textToSpeech && settings.soundEnabled && settings.enabled;
    setIsTTSActive(ttsEnabledRef.current);
  }, [settings.textToSpeech, settings.soundEnabled, settings.enabled]);

  // Body scroll management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Save settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save accessibility settings:', error);
      }
    }
  }, [settings]);

  // Apply visual settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Remove old style element
    const oldStyleElement = document.getElementById('accessibility-styles');
    if (oldStyleElement) {
      oldStyleElement.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-styles';
    
    if (!settings.enabled) {
      document.head.appendChild(styleElement);
      
      // Reset all visual effects
      document.documentElement.style.filter = '';
      document.documentElement.classList.remove('focus-mode');
      const guide = document.getElementById('reading-guide');
      if (guide) guide.remove();
      
      return;
    }
    
    let css = `
      body.accessibility-overlay-open {
        overflow: hidden !important;
      }
    `;
    
    // Font Size
    if (settings.fontSize !== 100) {
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          font-size: calc(1em * ${settings.fontSize / 100}) !important;
        }
      `;
    }
    
    // Line Height
    if (settings.lineHeight !== 100) {
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          line-height: ${settings.lineHeight / 100} !important;
        }
      `;
    }
    
    // Letter Spacing
    if (settings.letterSpacing !== 0) {
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          letter-spacing: ${settings.letterSpacing}px !important;
        }
      `;
    }
    
    // Font Weight
    if (settings.fontWeight !== 400) {
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          font-weight: ${settings.fontWeight} !important;
        }
      `;
    }
    
    // Text Align
    if (settings.textAlign !== 'left') {
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          text-align: ${settings.textAlign} !important;
        }
      `;
    }
    
    // Focus mode
    if (settings.focusMode) {
      css += `
        .focus-mode *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          outline: 2px solid #005EB8 !important;
          outline-offset: 2px !important;
        }
      `;
    }
    
    // Cursor size
    if (settings.cursorSize !== 'normal') {
      const cursorSize = settings.cursorSize === 'large' ? '32' : '48';
      css += `
        body *:not(#accessibility-overlay):not(#accessibility-overlay *) {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23005EB8" opacity="0.8"/></svg>') 16 16, auto !important;
        }
      `;
    }
    
    // Visual filters
    const filters: string[] = [];
    if (settings.contrast === 'high') filters.push('contrast(150%)');
    if (settings.contrast === 'higher') filters.push('contrast(200%)');
    if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
    if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
    if (settings.invertColors) filters.push('invert(1)');
    if (settings.grayscale) filters.push('grayscale(1)');
    
    if (filters.length > 0) {
      css += `
        body {
          filter: ${filters.join(' ')} !important;
        }
        #accessibility-overlay {
          filter: none !important;
        }
      `;
    }
    
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    // Focus mode class
    if (settings.focusMode) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
    
    // Reading guide
    if (settings.readingGuide) {
      setupReadingGuide();
    } else {
      const guide = document.getElementById('reading-guide');
      if (guide) guide.remove();
    }
    
  }, [settings]);

  // Setup reading guide
  const setupReadingGuide = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    let guide = document.getElementById('reading-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'reading-guide';
      guide.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: #005EB8;
        z-index: 9999;
        pointer-events: none;
        transform: translateY(-100%);
        transition: transform 0.2s ease;
      `;
      document.body.appendChild(guide);
    }
    
    const handleMouseMove = (e: MouseEvent): void => {
      if (guide) {
        guide.style.transform = `translateY(${e.clientY - 1}px)`;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const guideElement = document.getElementById('reading-guide');
      if (guideElement) {
        guideElement.remove();
      }
    };
  }, []);

  // TTS Effect - Main TTS logic
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const shouldEnableTTS = settings.textToSpeech && settings.soundEnabled && settings.enabled;
    
    if (!shouldEnableTTS) {
      // Clean up TTS
      removeTTSListeners();
      speechSynthesis.cancel();
      setIsTTSActive(false);
      return;
    }

    // Enable TTS
    setupTTSListeners();
    setIsTTSActive(true);

    return () => {
      removeTTSListeners();
      speechSynthesis.cancel();
    };
  }, [settings.textToSpeech, settings.soundEnabled, settings.enabled, settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices]);

  // TTS Functions
  const getTextFromElement = useCallback((element: HTMLElement): string => {
    try {
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        return img.alt || img.title || 'Gambar';
      }
      
      if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement;
        const label = document.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement | null;
        return label?.textContent?.trim() || 
               input.placeholder || 
               input.getAttribute('aria-label') || 
               `Input ${input.type}`;
      }
      
      if (element.tagName === 'BUTTON') {
        return element.textContent?.trim() || 
               element.getAttribute('aria-label') || 
               element.getAttribute('title') || 
               'Tombol';
      }
      
      if (element.tagName === 'A') {
        return element.textContent?.trim() || 
               element.getAttribute('title') || 
               element.getAttribute('aria-label') || 
               'Link';
      }
      
      if (element.tagName === 'SELECT') {
        const select = element as HTMLSelectElement;
        const selectedOption = select.options[select.selectedIndex];
        return `Pilihan: ${selectedOption?.text || 'Tidak ada pilihan'}`;
      }
      
      let text = '';
      
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        return ariaLabel;
      }
      
      const childNodes = element.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (textContent) {
            text += textContent + ' ';
          }
        }
      }
      
      if (!text.trim()) {
        const textElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, td, th, li');
        for (let i = 0; i < Math.min(textElements.length, 3); i++) {
          const el = textElements[i] as HTMLElement;
          const elementText = el.textContent?.trim();
          if (elementText && elementText.length < 100) {
            text += elementText + '. ';
          }
        }
      }
      
      return text.trim().substring(0, 200);
    } catch (error) {
      console.warn('Error getting text from element:', error);
      return '';
    }
  }, []);

  const speakElementText = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;
    
    try {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply TTS settings
      utterance.rate = settings.ttsRate;
      utterance.volume = settings.ttsVolume;
      
      // Set voice if available
      if (settings.ttsVoice && availableVoices.length > 0) {
        const selectedVoice = availableVoices.find(voice => voice.voiceURI === settings.ttsVoice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          // Fallback to Indonesian voice
          const indonesianVoice = availableVoices.find(voice => voice.lang.includes('id'));
          if (indonesianVoice) {
            utterance.voice = indonesianVoice;
          }
        }
      }
      
      // Fallback language
      if (!utterance.voice) {
        utterance.lang = 'id-ID';
      }
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Error with text-to-speech:', error);
    }
  }, [settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices]);

  const handleMouseEnter = useCallback((e: Event) => {
    if (!ttsEnabledRef.current) return;
    
    const target = e.target as HTMLElement;
    
    if (!target || target.closest('#accessibility-overlay')) return;
    if (target.tagName === 'BODY' || target.tagName === 'HTML') return;
    
    const textToSpeak = getTextFromElement(target);
    
    if (textToSpeak && textToSpeak.length > 0) {
      speakElementText(textToSpeak);
    }
  }, [getTextFromElement, speakElementText]);

  const handleMouseLeave = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  const setupTTSListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Store handler references
    mouseEnterHandlerRef.current = handleMouseEnter;
    mouseLeaveHandlerRef.current = handleMouseLeave;

    // Add listeners to all elements
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
      }
    });

  }, [handleMouseEnter, handleMouseLeave]);

  const removeTTSListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        if (mouseEnterHandlerRef.current) {
          element.removeEventListener('mouseenter', mouseEnterHandlerRef.current);
        }
        if (mouseLeaveHandlerRef.current) {
          element.removeEventListener('mouseleave', mouseLeaveHandlerRef.current);
        }
      }
    });

    mouseEnterHandlerRef.current = null;
    mouseLeaveHandlerRef.current = null;
  }, []);

  const resetSettings = useCallback((): void => {
    // Stop any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // Remove TTS listeners
    removeTTSListeners();
    
    const defaultSettings: AccessibilitySettings = {
      enabled: false,
      fontSize: 100,
      contrast: 'normal',
      brightness: 100,
      saturation: 100,
      invertColors: false,
      grayscale: false,
      lineHeight: 100,
      letterSpacing: 0,
      fontWeight: 400,
      textAlign: 'left',
      cursorSize: 'normal',
      readingGuide: false,
      focusMode: false,
      soundEnabled: true,
      textToSpeech: false,
      ttsRate: 1.0,
      ttsVolume: 0.8,
      ttsVoice: '',
      widgetPosition: 'right'
    };
    
    setSettings(defaultSettings);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accessibility-settings');
      } catch (error) {
        console.warn('Failed to clear accessibility settings:', error);
      }
    }
  }, [removeTTSListeners]);

  const toggleSetting = useCallback((key: keyof AccessibilitySettings): void => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ): void => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const speakText = useCallback((text: string): void => {
    if (!settings.enabled || !settings.soundEnabled) return;
    
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply TTS settings
        utterance.rate = settings.ttsRate;
        utterance.volume = settings.ttsVolume;
        
        // Set voice if available
        if (settings.ttsVoice && availableVoices.length > 0) {
          const selectedVoice = availableVoices.find(voice => voice.voiceURI === settings.ttsVoice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        
        // Fallback to Indonesian
        if (!utterance.voice) {
          utterance.lang = 'id-ID';
        }
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Error speaking text:', error);
    }
  }, [settings.enabled, settings.soundEnabled, settings.ttsRate, settings.ttsVolume, settings.ttsVoice, availableVoices]);

  const handleSoundToggle = useCallback((): void => {
    const newSoundEnabled = !settings.soundEnabled;
    
    if (!newSoundEnabled) {
      // Stop all speech when sound is disabled
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }
    
    setSettings(prev => ({
      ...prev,
      soundEnabled: newSoundEnabled,
      // Auto-disable textToSpeech when sound is disabled
      textToSpeech: newSoundEnabled ? prev.textToSpeech : false
    }));
  }, [settings.soundEnabled]);

  const handleTextToSpeechToggle = useCallback((): void => {
    const newTextToSpeech = !settings.textToSpeech;
    
    if (!newTextToSpeech) {
      // Stop speech when TTS is disabled
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    }
    
    setSettings(prev => ({
      ...prev,
      textToSpeech: newTextToSpeech
    }));
  }, [settings.textToSpeech]);

  const handleWidgetPositionToggle = useCallback((): void => {
    const newPosition = settings.widgetPosition === 'right' ? 'left' : 'right';
    setSettings(prev => ({
      ...prev,
      widgetPosition: newPosition
    }));
  }, [settings.widgetPosition]);

  const SettingButton: React.FC<SettingButtonProps> = ({ 
    icon: Icon, 
    label, 
    active, 
    onClick, 
    onMouseEnter,
    disabled = false,
    variant = 'primary'
  }) => {
    const variantStyles = {
      primary: active ? 'bg-[#005EB8] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      accent: active ? 'bg-[#F4B400] text-[#1A1A1A]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      success: active ? 'bg-[#008A00] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      danger: active ? 'bg-[#D93025] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    };

    return (
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => onMouseEnter && !disabled && speakText(label)}
        disabled={disabled}
        className={`
          flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
            : variantStyles[variant]
          }
          focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2
          min-h-[80px] w-full
        `}
        aria-pressed={active}
        aria-label={label}
        aria-disabled={disabled}
      >
        <Icon className="w-6 h-6 mb-2" />
        <span className="text-sm font-medium text-center leading-tight">{label}</span>
      </button>
    );
  };

  const SliderControl: React.FC<SliderControlProps> = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    onChange, 
    unit = '',
    disabled = false,
    onIncrement,
    onDecrement,
    icon: Icon,
    displayValue
  }) => (
    <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-[#005EB8]" />}
          <label className="text-sm font-medium text-gray-900">
            {label}
          </label>
        </div>
        <span className="text-sm font-semibold text-[#005EB8]">
          {displayValue || value}{unit}
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={disabled ? undefined : onDecrement}
          disabled={disabled || value <= min}
          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => !disabled && onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed"
          aria-label={`${label} control`}
        />
        <button
          onClick={disabled ? undefined : onIncrement}
          disabled={disabled || value >= max}
          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const categories = [
    { id: 'visual', label: 'Visual', icon: Monitor, color: 'primary' },
    { id: 'text', label: 'Teks', icon: Text, color: 'primary' },
    { id: 'motor', label: 'Navigasi', icon: Navigation, color: 'primary' },
    { id: 'audio', label: 'Audio', icon: Volume2, color: 'primary' }
  ];

  // Get rate display text
  const getRateDisplayText = (rate: number): string => {
    if (rate <= 0.5) return 'Sangat Lambat';
    if (rate <= 0.8) return 'Lambat';
    if (rate <= 1.0) return 'Normal';
    if (rate <= 1.3) return 'Cepat';
    return 'Sangat Cepat';
  };

  // Get volume display text
  const getVolumeDisplayText = (volume: number): string => {
    if (volume <= 0.3) return 'Sangat Pelan';
    if (volume <= 0.6) return 'Pelan';
    if (volume <= 0.8) return 'Normal';
    return 'Keras';
  };

  // Determine widget position classes
  const overlayPositionClass = settings.widgetPosition === 'right' ? 'right-0' : 'left-0';
  const triggerButtonPositionClass = settings.widgetPosition === 'right' ? 'right-8' : 'left-8';

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-8 p-5 rounded-full shadow-2xl transition-all duration-300 z-50 
          focus:outline-none focus:ring-4 focus:ring-[#005EB8] focus:ring-offset-2
          hover:scale-110 active:scale-95
          ${settings.enabled 
            ? 'bg-[#008A00] hover:bg-[#007A00] text-white' 
            : 'bg-[#005EB8] hover:bg-[#004EA0] text-white'
          }
          ${triggerButtonPositionClass}
        `}
        aria-label={`${settings.enabled ? 'Accessibility enabled' : 'Accessibility disabled'} - Toggle accessibility settings`}
        onMouseEnter={() => speakText('Pengaturan Aksesibilitas')}
      >
        <Accessibility className="w-7 h-7" />
      </button>

      {isOpen && (
        <div 
          id="accessibility-overlay" 
          className={`fixed top-0 h-screen bg-white shadow-2xl z-[10000] w-[480px] overflow-y-auto border-l border-gray-200 ${overlayPositionClass}`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#005EB8] to-[#004EA0] sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Accessibility className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Accessibility Menu
                </h2>
                <p className="text-white/80 text-sm">
                  Sesuaikan pengalaman browsing Anda
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetSettings}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Reset all settings"
                onMouseEnter={() => speakText('Reset Semua Pengaturan')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close accessibility settings"
                onMouseEnter={() => speakText('Tutup Pengaturan')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Aksesibilitas {settings.enabled ? 'Aktif' : 'Nonaktif'}
                </h3>
                <p className="text-sm text-gray-600">
                  {settings.enabled 
                    ? 'Semua fitur aksesibilitas sedang aktif' 
                    : 'Nyalakan untuk mengaktifkan semua fitur aksesibilitas'
                  }
                </p>
              </div>
              <button
                onClick={() => toggleSetting('enabled')}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005EB8]
                  ${settings.enabled 
                    ? 'bg-[#008A00]' 
                    : 'bg-gray-300'
                  }
                `}
                aria-label={`${settings.enabled ? 'Disable' : 'Enable'} accessibility features`}
                onMouseEnter={() => speakText(settings.enabled ? 'Matikan Aksesibilitas' : 'Aktifkan Aksesibilitas')}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg
                    ${settings.enabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {!settings.enabled && (
            <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <PowerOff className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm">
                    Fitur aksesibilitas dinonaktifkan
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Aktifkan untuk menggunakan semua fitur aksesibilitas
                  </p>
                </div>
              </div>
            </div>
          )}

          {settings.enabled && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <Power className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium text-sm">
                    Fitur aksesibilitas aktif
                  </p>
                  <p className="text-green-700 text-sm">
                    Semua pengaturan aksesibilitas diterapkan
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Widget Position Control - Added above categories */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Move className="w-5 h-5 text-[#005EB8]" />
                <span>Posisi Widget</span>
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900">Posisi {settings.widgetPosition === 'right' ? 'Kanan' : 'Kiri'}</p>
                    <p className="text-sm text-gray-600">
                      Widget akan ditampilkan di {settings.widgetPosition === 'right' ? 'sebelah kanan' : 'sebelah kiri'} layar
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleWidgetPositionToggle}
                  disabled={!settings.enabled}
                  className={`
                    relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005EB8]
                    ${settings.enabled 
                      ? 'bg-[#005EB8]' 
                      : 'bg-gray-300'
                    }
                  `}
                  aria-label={`Pindah widget ke ${settings.widgetPosition === 'right' ? 'kiri' : 'kanan'}`}
                  onMouseEnter={() => speakText(`Pindah widget ke ${settings.widgetPosition === 'right' ? 'kiri' : 'kanan'}`)}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg
                      ${settings.widgetPosition === 'right' ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => settings.enabled && setActiveCategory(category.id)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200
                      ${activeCategory === category.id
                        ? settings.enabled 
                          ? 'bg-[#005EB8] text-white shadow-lg' 
                          : 'bg-gray-300 text-gray-500'
                        : settings.enabled
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400'
                      }
                      ${!settings.enabled && 'cursor-not-allowed opacity-70'}
                      focus:outline-none focus:ring-2 focus:ring-[#005EB8]
                    `}
                    disabled={!settings.enabled}
                    onMouseEnter={() => settings.enabled && speakText(category.label)}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {activeCategory === 'visual' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-[#005EB8]" />
                  <span>Pengaturan Visual</span>
                </h3>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Ukuran Font"
                    value={settings.fontSize}
                    min={80}
                    max={150}
                    step={5}
                    unit="%"
                    onChange={(value) => updateSetting('fontSize', value)}
                    onIncrement={() => updateSetting('fontSize', Math.min(150, settings.fontSize + 5))}
                    onDecrement={() => updateSetting('fontSize', Math.max(80, settings.fontSize - 5))}
                    icon={Type}
                    disabled={!settings.enabled}
                  />
                  
                  <SliderControl
                    label="Kecerahan"
                    value={settings.brightness}
                    min={50}
                    max={150}
                    step={5}
                    unit="%"
                    onChange={(value) => updateSetting('brightness', value)}
                    onIncrement={() => updateSetting('brightness', Math.min(150, settings.brightness + 5))}
                    onDecrement={() => updateSetting('brightness', Math.max(50, settings.brightness - 5))}
                    icon={Monitor}
                    disabled={!settings.enabled}
                  />
                  
                  <SliderControl
                    label="Saturasi"
                    value={settings.saturation}
                    min={0}
                    max={200}
                    step={5}
                    unit="%"
                    onChange={(value) => updateSetting('saturation', value)}
                    onIncrement={() => updateSetting('saturation', Math.min(200, settings.saturation + 5))}
                    onDecrement={() => updateSetting('saturation', Math.max(0, settings.saturation - 5))}
                    icon={Palette}
                    disabled={!settings.enabled}
                  />
                  
                  <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${!settings.enabled ? 'opacity-50' : ''}`}>
                    <label className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Contrast className="w-4 h-4 text-[#005EB8]" />
                      <span>Kontras</span>
                    </label>
                    <select
                      value={settings.contrast}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => settings.enabled && updateSetting('contrast', e.target.value as AccessibilitySettings['contrast'])}
                      disabled={!settings.enabled}
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">Tinggi (150%)</option>
                      <option value="higher">Sangat Tinggi (200%)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <SettingButton
                      icon={Palette}
                      label="Balik Warna"
                      active={settings.invertColors}
                      onClick={() => toggleSetting('invertColors')}
                      onMouseEnter={() => speakText('Balik Warna')}
                      variant="accent"
                      disabled={!settings.enabled}
                    />
                    
                    <SettingButton
                      icon={Contrast}
                      label="Grayscale"
                      active={settings.grayscale}
                      onClick={() => toggleSetting('grayscale')}
                      onMouseEnter={() => speakText('Grayscale')}
                      variant="accent"
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'text' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Text className="w-5 h-5 text-[#005EB8]" />
                  <span>Pengaturan Teks</span>
                </h3>
                
                <div className="space-y-4">
                  <SliderControl
                    label="Tinggi Baris"
                    value={settings.lineHeight}
                    min={80}
                    max={200}
                    step={5}
                    unit="%"
                    onChange={(value) => updateSetting('lineHeight', value)}
                    onIncrement={() => updateSetting('lineHeight', Math.min(200, settings.lineHeight + 5))}
                    onDecrement={() => updateSetting('lineHeight', Math.max(80, settings.lineHeight - 5))}
                    icon={Text}
                    disabled={!settings.enabled}
                  />
                  
                  <SliderControl
                    label="Jarak Huruf"
                    value={settings.letterSpacing}
                    min={0}
                    max={5}
                    step={0.1}
                    unit="px"
                    onChange={(value) => updateSetting('letterSpacing', value)}
                    onIncrement={() => updateSetting('letterSpacing', Math.min(5, settings.letterSpacing + 0.1))}
                    onDecrement={() => updateSetting('letterSpacing', Math.max(0, settings.letterSpacing - 0.1))}
                    icon={Type}
                    disabled={!settings.enabled}
                  />
                  
                  <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${!settings.enabled ? 'opacity-50' : ''}`}>
                    <label className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Bold className="w-4 h-4 text-[#005EB8]" />
                      <span>Ketebalan Font</span>
                    </label>
                    <select
                      value={settings.fontWeight}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => settings.enabled && updateSetting('fontWeight', Number(e.target.value))}
                      disabled={!settings.enabled}
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value={400}>Normal (400)</option>
                      <option value={600}>Sedang (600)</option>
                      <option value={700}>Bold (700)</option>
                      <option value={900}>Extra Bold (900)</option>
                    </select>
                  </div>
                  
                  <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${!settings.enabled ? 'opacity-50' : ''}`}>
                    <label className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <AlignLeft className="w-4 h-4 text-[#005EB8]" />
                      <span>Penjajaran Teks</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => settings.enabled && updateSetting('textAlign', 'left')}
                        disabled={!settings.enabled}
                        className={`p-3 rounded-lg flex items-center justify-center ${
                          settings.textAlign === 'left' 
                            ? 'bg-[#005EB8] text-white' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => settings.enabled && updateSetting('textAlign', 'center')}
                        disabled={!settings.enabled}
                        className={`p-3 rounded-lg flex items-center justify-center ${
                          settings.textAlign === 'center' 
                            ? 'bg-[#005EB8] text-white' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => settings.enabled && updateSetting('textAlign', 'right')}
                        disabled={!settings.enabled}
                        className={`p-3 rounded-lg flex items-center justify-center ${
                          settings.textAlign === 'right' 
                            ? 'bg-[#005EB8] text-white' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => settings.enabled && updateSetting('textAlign', 'justify')}
                        disabled={!settings.enabled}
                        className={`p-3 rounded-lg flex items-center justify-center ${
                          settings.textAlign === 'justify' 
                            ? 'bg-[#005EB8] text-white' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <AlignJustify className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'motor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-[#005EB8]" />
                  <span>Navigasi & Motor</span>
                </h3>
                
                <div className="space-y-4">
                  <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${!settings.enabled ? 'opacity-50' : ''}`}>
                    <label className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <MousePointer className="w-4 h-4 text-[#005EB8]" />
                      <span>Ukuran Kursor</span>
                    </label>
                    <select
                      value={settings.cursorSize}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => settings.enabled && updateSetting('cursorSize', e.target.value as AccessibilitySettings['cursorSize'])}
                      disabled={!settings.enabled}
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="normal">Normal</option>
                      <option value="large">Besar</option>
                      <option value="extra">Ekstra Besar</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <SettingButton
                      icon={Focus}
                      label="Panduan Baca"
                      active={settings.readingGuide}
                      onClick={() => toggleSetting('readingGuide')}
                      onMouseEnter={() => speakText('Panduan Baca')}
                      variant="success"
                      disabled={!settings.enabled}
                    />
                    
                    <SettingButton
                      icon={settings.focusMode ? EyeOff : Eye}
                      label="Mode Fokus"
                      active={settings.focusMode}
                      onClick={() => toggleSetting('focusMode')}
                      onMouseEnter={() => speakText('Mode Fokus')}
                      variant="success"
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'audio' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-[#005EB8]" />
                  <span>Pengaturan Audio</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SettingButton
                      icon={settings.soundEnabled ? Volume2 : VolumeX}
                      label={settings.soundEnabled ? 'Suara Aktif' : 'Suara Nonaktif'}
                      active={settings.soundEnabled}
                      onClick={handleSoundToggle}
                      onMouseEnter={() => speakText(settings.soundEnabled ? 'Suara Aktif' : 'Suara Nonaktif')}
                      variant="accent"
                      disabled={!settings.enabled}
                    />
                    
                    <SettingButton
                      icon={Volume2}
                      label="Text-to-Speech"
                      active={settings.textToSpeech}
                      onClick={handleTextToSpeechToggle}
                      onMouseEnter={() => speakText('Text-to-Speech untuk semua elemen')}
                      variant="accent"
                      disabled={!settings.enabled || !settings.soundEnabled}
                    />
                  </div>
                  
                  {isTTSActive && (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <div className="p-1 bg-blue-100 rounded">
                            <Volume2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-blue-800 font-medium text-sm">
                              Text-to-Speech Aktif
                            </p>
                            <p className="text-blue-700 text-sm">
                              Arahkan kursor ke elemen apapun untuk mendengar teksnya
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* TTS Rate Control */}
                      <SliderControl
                        label="Kecepatan Bicara"
                        value={settings.ttsRate}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        onChange={(value) => updateSetting('ttsRate', value)}
                        onIncrement={() => updateSetting('ttsRate', Math.min(2.0, settings.ttsRate + 0.1))}
                        onDecrement={() => updateSetting('ttsRate', Math.max(0.5, settings.ttsRate - 0.1))}
                        icon={Gauge}
                        disabled={!settings.enabled || !settings.soundEnabled}
                        displayValue={getRateDisplayText(settings.ttsRate)}
                      />

                      {/* TTS Volume Control */}
                      <SliderControl
                        label="Volume Suara"
                        value={settings.ttsVolume}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        onChange={(value) => updateSetting('ttsVolume', value)}
                        onIncrement={() => updateSetting('ttsVolume', Math.min(1.0, settings.ttsVolume + 0.1))}
                        onDecrement={() => updateSetting('ttsVolume', Math.max(0.1, settings.ttsVolume - 0.1))}
                        icon={Volume}
                        disabled={!settings.enabled || !settings.soundEnabled}
                        displayValue={getVolumeDisplayText(settings.ttsVolume)}
                      />

                      {/* TTS Voice Selection */}
                      <div className={`space-y-3 p-4 bg-gray-50 rounded-xl ${(!settings.enabled || !settings.soundEnabled) ? 'opacity-50' : ''}`}>
                        <label className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                          <User className="w-4 h-4 text-[#005EB8]" />
                          <span>Pilihan Suara</span>
                        </label>
                        <select
                          value={settings.ttsVoice}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => settings.enabled && settings.soundEnabled && updateSetting('ttsVoice', e.target.value)}
                          disabled={!settings.enabled || !settings.soundEnabled || availableVoices.length === 0}
                          className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Suara Default</option>
                          {availableVoices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                        </select>
                        {availableVoices.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Tidak ada suara yang tersedia. Pastikan browser mendukung text-to-speech.
                          </p>
                        )}
                      </div>

                      {/* Test TTS Button */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-800 font-medium text-sm">
                              Uji Text-to-Speech
                            </p>
                            <p className="text-green-700 text-sm">
                              Dengarkan bagaimana pengaturan suara Anda
                            </p>
                          </div>
                          <button
                            onClick={() => speakText('Ini adalah contoh suara dari pengaturan text-to-speech. Anda dapat mengatur kecepatan, volume, dan jenis suara sesuai preferensi.')}
                            disabled={!settings.enabled || !settings.soundEnabled}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Test Suara
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {settings.textToSpeech && !settings.soundEnabled && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-yellow-100 rounded">
                          <VolumeX className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-yellow-800 font-medium text-sm">
                            Text-to-Speech Tidak Dapat Digunakan
                          </p>
                          <p className="text-yellow-700 text-sm">
                            Nyalakan opsi "Suara Aktif" untuk menggunakan Text-to-Speech
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-track {
          background: #d1d5db;
          border-radius: 9999px;
          height: 8px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #005EB8;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-track {
          background: #d1d5db;
          border-radius: 9999px;
          height: 8px;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #005EB8;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
          background: #9ca3af;
        }
        
        .slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
          background: #9ca3af;
        }
      `}</style>
    </>
  );
};

export default AccessibilityOverlay;
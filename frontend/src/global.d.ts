declare module '*.scss'
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.bmp'
declare module '*.tiff'
declare module 'react-color'

interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: (ev: Event) => any;
    onsoundstart: (ev: Event) => any;
    onspeechstart: (ev: Event) => any;
    onspeechend: (ev: Event) => any;
    onsoundend: (ev: Event) => any;
    onaudioend: (ev: Event) => any;
    onresult: (ev: SpeechRecognitionEvent) => any;
    onnomatch: (ev: SpeechRecognitionEvent) => any;
    onerror: (ev: SpeechRecognitionError) => any;
    onstart: (ev: Event) => any;
    onend: (ev: Event) => any;
}

interface SpeechRecognitionStatic {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
}
declare var SpeechRecognition: SpeechRecognitionStatic;
declare var webkitSpeechRecognition: SpeechRecognitionStatic;

interface SpeechRecognitionError extends Event {
    error: string;
    message: string;
}


interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
    interpretation: any;
    emma: Document;
}

interface SpeechGrammar {
    src: string;
    weight: number;
}
interface SpeechGrammarStatic {
    prototype: SpeechGrammar;
    new (): SpeechGrammar;
}
declare var SpeechGrammar: SpeechGrammarStatic;
declare var webkitSpeechGrammar: SpeechGrammarStatic;

interface SpeechGrammarList {
    length: number;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
    addFromURI(src: string, weight: number): void;
    addFromString(string: string, weight: number): void;
}
interface SpeechGrammarListStatic {
    prototype: SpeechGrammarList;
    new (): SpeechGrammarList;
}
declare var SpeechGrammarList: SpeechGrammarListStatic;
declare var webkitSpeechGrammarList: SpeechGrammarListStatic;

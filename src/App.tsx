import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    HelmetState, HelmetType, DecalPrompt, StyleId, ActiveTab, FullViewResult, initialHelmetState, initialDecalPrompt
} from './types';
import {
    fileToBase64, decalPromptToText, parsePromptText,
    getHelmetProfileInstructions, getTimestamp, generateProPrompt
} from './utils';
import {
    HelmetUploader, Helmet2Target, DecalPromptBuilder,
    AdvancedOptions, ResultsDisplay
} from './components';
import { LogoIcon } from './icons';
import { baseHelmetImages } from './assets';

const ErrorMessage = ({ message, onClear }: { message: string; onClear: () => void }) => (
    <div className="error-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{message}</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem', padding: '0 0.5rem' }}>&times;</button>
    </div>
);

const App = () => {
    // State
    const [helmet1, setHelmet1] = useState<HelmetState>(initialHelmetState);
    const [helmet1Status, setHelmet1Status] = useState<'idle' | 'analyzing' | 'extracted' | 'error'>('idle');
    const [decalPromptEn, setDecalPromptEn] = useState<DecalPrompt>(initialDecalPrompt);
    const [editedPrompt, setEditedPrompt] = useState<string>('');
    const [proPromptText, setProPromptText] = useState<string>('');
    const [activePromptTab, setActivePromptTab] = useState<'simple' | 'pro'>('simple');
    const [lang, setLang] = useState<'en' | 'vi'>('en');
    
    const [helmet2, setHelmet2] = useState<HelmetState>(initialHelmetState);
    const [helmet2Type, setHelmet2Type] = useState<HelmetType | null>(null);
    const [recommendedHelmet2Type, setRecommendedHelmet2Type] = useState<HelmetType | null>(null);
    const [lockedHelmet2Type, setLockedHelmet2Type] = useState<HelmetType | null>(null);

    const [preserveFinish, setPreserveFinish] = useState(true);
    const [avoidZones, setAvoidZones] = useState(true);

    const [result, setResult] = useState<string | null>(null);
    const [promptTypeUsed, setPromptTypeUsed] = useState<'simple' | 'pro' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('single');
    const [error, setError] = useState<string | null>(null);

    // Full View State
    const [fullViewResult, setFullViewResult] = useState<FullViewResult>(null);
    const [isGeneratingFullView, setIsGeneratingFullView] = useState(false);

    // Style Pack State
    const [stylePackResult, setStylePackResult] = useState<string | null>(null);
    const [isStyling, setIsStyling] = useState(false);
    const [styleId, setStyleId] = useState<StyleId>('line-sketch');
    const [styleStrength, setStyleStrength] = useState(70);
    const [stylePreserveFinish, setStylePreserveFinish] = useState(true);
    const [styleLockSeed, setStyleLockSeed] = useState(false);
    const [styleCache, setStyleCache] = useState<Record<string, string>>({});

    const currentPromptText = useMemo(() => decalPromptToText(decalPromptEn, lang, preserveFinish, avoidZones), [decalPromptEn, lang, preserveFinish, avoidZones]);

    useEffect(() => {
        setEditedPrompt(currentPromptText);
    }, [currentPromptText]);
    
    useEffect(() => {
        if (helmet1Status === 'extracted' && recommendedHelmet2Type) {
            setProPromptText(generateProPrompt(decalPromptEn, recommendedHelmet2Type, lang, preserveFinish));
        } else {
            setProPromptText('');
        }
    }, [decalPromptEn, recommendedHelmet2Type, lang, preserveFinish, helmet1Status]);

    const handleStartOver = useCallback(() => {
        setHelmet1(initialHelmetState);
        setHelmet1Status('idle');
        setDecalPromptEn(initialDecalPrompt);
        setEditedPrompt('');
        setProPromptText('');
        setActivePromptTab('simple');
        setHelmet2(initialHelmetState);
        setHelmet2Type(null);
        setRecommendedHelmet2Type(null);
        setLockedHelmet2Type(null);
        setResult(null);
        setPromptTypeUsed(null);
        setIsLoading(false);
        setLoadingText('');
        setActiveTab('single');
        setError(null);
        setFullViewResult(null);
        setIsGeneratingFullView(false);
        setStylePackResult(null);
        setIsStyling(false);
        setStyleCache({});
    }, []);

    const runAI = useCallback(async (action: string, payload: any, setLoading: (loading: boolean) => void, loadingText: string, errorContext: string): Promise<string | null> => {
        setError(null);
        setLoading(true);
        setLoadingText(loadingText);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            });

            const data = await response.json();

            if (!response.ok) {
                 if (response.status === 429) {
                    throw new Error("You've exceeded the API request limit. Please wait a moment and try again.");
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data.result;
        } catch (e: any) {
            console.error(e);
            setError(`[${errorContext}] ${e.message || 'An unknown error occurred.'}`);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const analyzeHelmet1 = useCallback(async (file: File) => {
        setHelmet1Status('analyzing');
        const { mimeType, data } = await fileToBase64(file);
        
        const responseText = await runAI(
            'analyzeHelmet1',
            { image: { mimeType, data } },
            () => {}, // Inline loading, not using the main spinner
            '',
            'Helmet 1 Analysis'
        );

        if (responseText) {
            try {
                const resultData = JSON.parse(responseText);
                setDecalPromptEn(resultData.decalPromptEn);
                setRecommendedHelmet2Type(resultData.helmetType);
                if (!helmet2Type) setHelmet2Type(resultData.helmetType);
                setHelmet1Status('extracted');
            } catch (e: any) {
                 setError(`[Helmet 1 Parse] Failed to parse analysis result. ${e.message}`);
                 setHelmet1Status('error');
            }
        } else {
            setHelmet1Status('error');
        }
    }, [runAI, helmet2Type]);

    const analyzeAndLockHelmet2 = useCallback(async (file: File) => {
        const { mimeType, data } = await fileToBase64(file);
        const responseText = await runAI(
            'analyzeHelmet2',
            { image: { mimeType, data } },
            () => {},
            '',
            'Helmet 2 Analysis'
        );

        if (responseText) {
            try {
                const resultData = JSON.parse(responseText);
                if (resultData.helmetType) {
                    setHelmet2Type(resultData.helmetType);
                    setLockedHelmet2Type(resultData.helmetType);
                }
            } catch (e) {
                console.error("Failed to parse Helmet 2 type:", e);
            }
        }
    }, [runAI]);
    
    const handleHelmet1Select = useCallback(async (file: File) => {
        handleStartOver();
        const { previewUrl } = await fileToBase64(file);
        setHelmet1({ file, previewUrl });
        analyzeHelmet1(file);
    }, [analyzeHelmet1, handleStartOver]);
    
    const handlePromptChange = useCallback((newPrompt: string) => {
        setEditedPrompt(newPrompt);
        const parsed = parsePromptText(newPrompt);
        setDecalPromptEn(parsed);
    }, []);

    const handleTranslate = useCallback(() => {
        setLang(prevLang => prevLang === 'en' ? 'vi' : 'en');
    }, []);

    const handleHelmetTypeChange = useCallback((type: HelmetType) => {
        if (type !== helmet2Type) {
            setResult(null);
            setPromptTypeUsed(null);
            setActiveTab('single');
            setFullViewResult(null);
            setStylePackResult(null);
            setStyleCache({});
            setHelmet2Type(type);
        }
    }, [helmet2Type]);

    const handleGenerateSingleView = useCallback(async () => {
        const selectedHelmetType = lockedHelmet2Type || helmet2Type;
        if (!selectedHelmetType) {
            setError("Please select a Helmet 2 type.");
            return;
        }

        setPromptTypeUsed(activePromptTab);
        let decalPrompt = activePromptTab === 'simple' ? editedPrompt : proPromptText;
        
        let resultImageUrl: string | null = null;
        
        if (helmet2.file) { // Edit existing image
            const { mimeType, data } = await fileToBase64(helmet2.file);
            const fullPrompt = `${decalPrompt}${getHelmetProfileInstructions(selectedHelmetType, lang)}`;
            
            resultImageUrl = await runAI(
                'editImage',
                { image: { data, mimeType }, prompt: fullPrompt, model: 'gemini-2.5-flash-image' },
                setIsLoading,
                'Applying decal to your helmet...',
                'Single View Edit'
            );
        } else { // Generate new image using workaround
            const baseImageUri = baseHelmetImages[selectedHelmetType];
            const [header, base64Data] = baseImageUri.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/svg+xml';
            const data = base64Data;
            
            const fullPrompt = `First, turn this placeholder shape into a realistic, photorealistic, studio-shot image of a brand new ${selectedHelmetType} motorcycle helmet. The helmet should have a neutral black color (#111) and a smooth gloss finish, shown from the right profile (90 degrees). Place it on a neutral white studio background (#FFFFFF). Then, apply the following decal design to it:\n\n${decalPrompt}${getHelmetProfileInstructions(selectedHelmetType, lang)}`;

            resultImageUrl = await runAI(
                'editImage',
                { image: { data, mimeType }, prompt: fullPrompt, model: 'gemini-2.5-flash-image' },
                setIsLoading,
                'Generating new helmet...',
                'Single View Generation'
            );
        }
        
        if (resultImageUrl) {
            setResult(resultImageUrl);
            setActiveTab('single');
            setFullViewResult(null);
            setStylePackResult(null);
            setStyleCache({});
        }
    }, [runAI, editedPrompt, proPromptText, activePromptTab, helmet2, helmet2Type, lockedHelmet2Type, lang]);
    
    const handleGenerateFullView = useCallback(async () => {
        if (!result) {
            setError("Please generate a Single View result first.");
            return;
        }
    
        const mimeType = result.split(';')[0].split(':')[1];
        const data = result.split(',')[1];
        const originalPrompt = promptTypeUsed === 'pro' ? proPromptText : editedPrompt;

        const prompt = `You are a professional product photographer and graphic designer. Your task is to create a composite product showcase image. You will use a provided single helmet image as a reference and an original design brief for accuracy.

**Original Design Brief (Source of Truth):**
---
${originalPrompt}
---

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
1.  **Reference Image:** The provided image is the primary visual reference for the main view (right-profile). You must match its style and decal application precisely.
2.  **Design Brief:** The text brief is the absolute source of truth for the design. Use it to accurately create the unseen front and rear views, ensuring perfect consistency.
3.  **Layout Requirement: EXACTLY THREE VIEWS.**
    *   You MUST generate a single composite image containing exactly **THREE** distinct views of the helmet. Do NOT generate more or fewer than three views. Do NOT duplicate any views.
    *   **View 1 (Main View, Large):** The right-profile view, which should be the largest and most prominent element, closely matching the provided reference image.
    *   **View 2 (Secondary View, Smaller):** A direct front-on view of the helmet.
    *   **View 3 (Secondary View, Smaller):** A direct rear-on view of the helmet.
    *   Arrange these three views aesthetically on a single canvas.

4.  **Absolute Consistency:** The decal design, colors (including HEX codes from the brief), text, and finish on the front and rear views must be a perfect, logical continuation of the main view. All three views must look like the exact same product shot from different angles.
5.  **Background & Style:** Place all three views on a clean, seamless, neutral light grey (#f0f0f0) professional studio background. The lighting must be soft and consistent across all views.
6.  **Final Output:** The final result must be a single, high-resolution, photorealistic image suitable for a product catalog.`;

        const compositeImageUrl = await runAI(
            'editImage',
            { image: { data, mimeType }, prompt, model: 'gemini-2.5-flash-image' },
            setIsGeneratingFullView,
            'Generating Full View...',
            'Full View Generation'
        );
        
        if(compositeImageUrl) {
            setFullViewResult(compositeImageUrl);
        }
    }, [result, runAI, promptTypeUsed, proPromptText, editedPrompt]);
    
    const handleApplyStyle = useCallback(async () => {
        if (!result) {
            setError("Please generate a Single View result first to apply a style.");
            return;
        }

        const cacheKey = `${styleId}-${styleStrength}-${stylePreserveFinish}-${styleLockSeed}`;
        if (styleCache[cacheKey]) {
            setStylePackResult(styleCache[cacheKey]);
            return;
        }

        const mimeType = result.split(';')[0].split(':')[1];
        const data = result.split(',')[1];
        
        const stylePrompts: Record<StyleId, string> = {
            'line-sketch': `Redraw this helmet as a clean, technical line art sketch. Strength: ${styleStrength}%.`,
            'watercolor': `Reimagine this helmet with a vibrant, loose watercolor effect. Strength: ${styleStrength}%.`,
            'marker': `Render this helmet design using Copic-style markers with bold outlines and blended colors. Strength: ${styleStrength}%.`,
            'neon': `Transform this helmet into a glowing neon and chrome cyberpunk design. Strength: ${styleStrength}%.`
        };

        let prompt = stylePrompts[styleId];
        if (stylePreserveFinish) {
            prompt += " Preserve the original gloss or matte finish of the helmet shell underneath the style.";
        }

        const styledImageUrl = await runAI(
            'editImage',
            { image: { data, mimeType }, prompt, model: 'gemini-2.5-flash-image' },
            setIsStyling,
            `Applying ${styleId} style...`,
            'Style Pack Generation'
        );
        
        if (styledImageUrl) {
            setStylePackResult(styledImageUrl);
            setStyleCache(prev => ({ ...prev, [cacheKey]: styledImageUrl }));
        }
    }, [result, styleId, styleStrength, stylePreserveFinish, styleLockSeed, styleCache, runAI]);


     const onDownload = (dataUrl: string, name: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${name}_${getTimestamp()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-title-group">
                    <LogoIcon />
                    <h1>Decal Transfer Studio</h1>
                </div>
                <p>Automatically 'reads' the decal from Helmet 1, generates a prompt, and then applies that decal to Helmet 2.</p>
            </header>
            
            {error && <ErrorMessage message={error} onClear={() => setError(null)} />}

            <main className="main-content">
                <div className="column">
                    <HelmetUploader
                        id="helmet1"
                        title="1. Helmet 1 (Source)"
                        onFileSelect={handleHelmet1Select}
                        previewUrl={helmet1.previewUrl}
                        status={helmet1Status}
                        onReload={() => helmet1.file && analyzeHelmet1(helmet1.file)}
                        onClear={handleStartOver}
                    />
                    <Helmet2Target
                        helmet={helmet2}
                        onFileSelect={async (file) => {
                            const { previewUrl } = await fileToBase64(file);
                            setHelmet2({ file, previewUrl });
                            analyzeAndLockHelmet2(file);
                        }}
                        onClear={() => {
                            setHelmet2(initialHelmetState);
                            setLockedHelmet2Type(null);
                        }}
                        selectedType={helmet2Type}
                        recommendedType={recommendedHelmet2Type}
                        lockedType={lockedHelmet2Type}
                        onTypeChange={handleHelmetTypeChange}
                    />
                </div>

                <div className="column">
                    <DecalPromptBuilder
                        prompt={editedPrompt}
                        proPrompt={proPromptText}
                        onPromptChange={handlePromptChange}
                        activePromptTab={activePromptTab}
                        onActivePromptTabChange={setActivePromptTab}
                        activeLang={lang}
                        onTranslate={handleTranslate}
                    />
                     <AdvancedOptions
                      preserveFinish={preserveFinish}
                      setPreserveFinish={setPreserveFinish}
                      avoidZones={avoidZones}
                      setAvoidZones={setAvoidZones}
                    />
                    <div className="cta-buttons-container">
                        <button 
                            className="cta-button cta-button--pro" 
                            onClick={handleGenerateSingleView} 
                            disabled={isLoading || isGeneratingFullView || isStyling || helmet1Status !== 'extracted'}
                            title={helmet1Status !== 'extracted' ? 'Please upload and analyze Helmet 1 first' : ''}
                        >
                            {isLoading ? 'Generating...' : (result ? 'Regenerate' : 'Generate')}
                        </button>
                    </div>
                </div>

                <div className="column">
                    <ResultsDisplay
                        result={result}
                        promptTypeUsed={promptTypeUsed}
                        isLoading={isLoading}
                        loadingText={loadingText}
                        helmet1Status={helmet1Status}
                        onStartOver={handleStartOver}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        // Download Handlers
                        onDownloadSingleView={() => {
                            if (result) {
                                onDownload(result, 'single_view');
                            }
                        }}
                        onDownloadFullView={() => fullViewResult && onDownload(fullViewResult, 'full_view_composite')}
                        onDownloadStylePack={() => stylePackResult && onDownload(stylePackResult, `style_${styleId}`)}
                        // Full View Props
                        fullViewResult={fullViewResult}
                        isGeneratingFullView={isGeneratingFullView}
                        onGenerateFullView={handleGenerateFullView}
                        // Style Pack Props
                        stylePackResult={stylePackResult}
                        isStyling={isStyling}
                        styleId={styleId}
                        onStyleIdChange={setStyleId}
                        strength={styleStrength}
                        onStrengthChange={setStyleStrength}
                        preserveFinish={stylePreserveFinish}
                        onPreserveFinishChange={setStylePreserveFinish}
                        lockSeed={styleLockSeed}
                        onLockSeedChange={setStyleLockSeed}
                        onApplyOrReload={handleApplyStyle}
                        isCached={!!styleCache[`${styleId}-${styleStrength}-${stylePreserveFinish}-${styleLockSeed}`]}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;
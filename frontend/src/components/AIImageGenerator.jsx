import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './AIImageGenerator.module.css';
import productMediaAIAPI from '../services/productMediaAIAPI';

function AIImageGenerator({ productId, productName, onImageGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [prompt, setPrompt] = useState(`High-quality product photo of ${productName || 'agricultural product'}`);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    if (!selectedProductId.trim()) {
      setError('A product ID is required so the generated asset can be audited and stored.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await productMediaAIAPI.generateImage(selectedProductId, prompt);
      const result = response.data?.data || response.data;
      if (!result?.ok || !result.imageUrl) {
        setError(result?.envVar ?
          `Image provider is not configured. Configure ${result.envVar} before generating assets.` :
          'The image provider did not return an image. No placeholder was created.');
        return;
      }
      setGeneratedImage(result.imageUrl);
      if (onImageGenerated) onImageGenerated(result.imageUrl);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Image generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClick = () => {
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3>🤖 AI Image Generator</h3>
          <p>Generate professional product photos using AI</p>
        </div>

        <div className={styles.content}>
          {!generatedImage ? (
            <>
              <div className={styles.promptSection}>
                <label htmlFor="product-id">Product ID</label>
                <input
                  id="product-id"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  placeholder="Enter the catalog product ID"
                  className={styles.textarea}
                />
              </div>
              <div className={styles.promptSection}>
                <label htmlFor="prompt">Product Description</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the product you want to generate an image for..."
                  className={styles.textarea}
                  rows="4"
                />
                <small className={styles.hint}>
                  ✨ Tip: Include colors, style, setting, and quality details for better results
                </small>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  ❌ {error}
                </div>
              )}

              <button
                onClick={generateImage}
                disabled={loading}
                className={styles.generateBtn}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ Generate Image
                  </>
                )}
              </button>

              <div className={styles.features}>
                <h4>Why Use AI Images?</h4>
                <ul>
                  <li>⚡ Generate professional photos instantly</li>
                  <li>📸 Consistent quality across products</li>
                  <li>💡 Show products in various settings</li>
                  <li>🌍 Attract international buyers</li>
                  <li>💰 Save on photography costs</li>
                </ul>
              </div>
            </>
          ) : (
            <div className={styles.resultSection}>
              <div className={styles.imageContainer}>
                <img src={generatedImage} alt="Generated product" className={styles.image} />
                <div className={styles.trustBadge}>AI Generated ✓</div>
              </div>

              <div className={styles.actions}>
                <button className={styles.useImageBtn} onClick={() => onImageGenerated?.(generatedImage)}>
                  ✅ Use This Image
                </button>
                <button className={styles.regenerateBtn} onClick={handleRegenerateClick}>
                  🔄 Generate Another
                </button>
              </div>

              <div className={styles.imageInfo}>
                <p><strong>Prompt:</strong> {prompt}</p>
                <p className={styles.timestamp}>Generated at {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AIImageGenerator.propTypes = {
  productId: PropTypes.string,
  productName: PropTypes.string,
  onImageGenerated: PropTypes.func,
};

export default AIImageGenerator;

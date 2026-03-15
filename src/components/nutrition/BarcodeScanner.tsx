import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ScannedProduct {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  barcode: string;
}

interface BarcodeScannerProps {
  onProductScanned: (product: ScannedProduct) => void;
}

export function BarcodeScanner({ onProductScanned }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const fetchProduct = async (barcode: string) => {
    // Check cache first
    const cached = JSON.parse(localStorage.getItem('recently_scanned_foods') || '[]');
    const found = cached.find((p: ScannedProduct) => p.barcode === barcode);
    if (found) {
      onProductScanned(found);
      setOpen(false);
      return;
    }

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,nutriments,serving_size`
      );
      const json = await res.json();
      if (json.status !== 1 || !json.product) {
        setError('Product not found in database. Try adding it manually.');
        setScanning(false);
        return;
      }
      const p = json.product;
      const product: ScannedProduct = {
        name: p.product_name || 'Unknown Product',
        calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fats: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
        barcode,
      };

      // Cache it
      const newCache = [product, ...cached.filter((c: ScannedProduct) => c.barcode !== barcode)].slice(0, 20);
      localStorage.setItem('recently_scanned_foods', JSON.stringify(newCache));

      onProductScanned(product);
      setOpen(false);
    } catch {
      setError('Failed to fetch product data. Check your connection.');
      setScanning(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use BarcodeDetector if available, else fall back to zxing
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              stopCamera();
              await fetchProduct(barcodes[0].rawValue);
            }
          } catch {}
        }, 300);
      } else {
        // Fallback: use zxing
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const scan = async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          try {
            const luminance = reader.decodeFromCanvas(canvas);
            if (luminance) {
              stopCamera();
              await fetchProduct(luminance.getText());
            }
          } catch {}
        };
        intervalRef.current = window.setInterval(scan, 500);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else {
        setError('Could not access camera. Make sure no other app is using it.');
      }
      setScanning(false);
    }
  };

  useEffect(() => {
    if (open) startCamera();
    return () => stopCamera();
  }, [open]);

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} title="Scan barcode">
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { stopCamera(); setOpen(false); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning overlay */}
            {scanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-primary rounded-lg relative">
                  <div className="absolute left-0 right-0 h-0.5 bg-primary animate-pulse" 
                       style={{ top: '50%', boxShadow: '0 0 8px hsl(var(--primary))' }} />
                </div>
                <p className="text-white text-sm mt-4 bg-black/50 px-3 py-1 rounded">
                  Point camera at barcode
                </p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                <p className="text-white text-sm">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => { setError(null); startCamera(); }}>
                  Try Again
                </Button>
              </div>
            )}

            {!scanning && !error && (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => { stopCamera(); setOpen(false); }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

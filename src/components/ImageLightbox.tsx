import React from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface ImageLightboxProps {
  images: string[];           // 画像URLの配列
  isOpen: boolean;           // 表示状態
  currentIndex: number;      // 現在表示中の画像インデックス
  onClose: () => void;       // 閉じる時のコールバック
  altText?: string;          // 代替テキスト（アクセシビリティ）
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  isOpen,
  currentIndex,
  onClose,
  altText = "拡大画像"
}) => {
  const slides = images.map((src) => ({ src, alt: altText }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex}
      plugins={[Zoom, Thumbnails]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
      }}
      thumbnails={{
        position: "bottom",
        width: 120,
        height: 80,
        border: 0,
        borderRadius: 4,
        padding: 4,
        gap: 16,
      }}
      carousel={{
        finite: false,
        preload: 2,
      }}
      render={{
        buttonPrev: images.length <= 1 ? () => null : undefined,
        buttonNext: images.length <= 1 ? () => null : undefined,
      }}
    />
  );
};
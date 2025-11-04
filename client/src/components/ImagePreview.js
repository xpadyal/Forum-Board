"use client";

/**
 * ImagePreview component - Displays thread image attachments in Reddit-style
 */
export default function ImagePreview({ images, alt = "Thread image" }) {
  if (!images || images.length === 0) return null;

  const handleImageError = (e) => {
    e.target.style.display = "none";
    const fallback = e.target.parentElement;
    if (fallback) {
      fallback.innerHTML =
        '<div class="p-4 text-center text-gray-400"><svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Image</p></div>';
    }
  };

  return (
    <div className="sm:w-40 sm:min-w-[160px] w-full h-40 sm:h-40 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
      {images.length === 1 ? (
        <img
          src={images[0].fileUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
          {images.slice(0, 4).map((attachment, idx) => (
            <div
              key={attachment.id || idx}
              className={`relative overflow-hidden ${
                idx === 0 && images.length === 3 ? "col-span-2" : ""
              }`}
            >
              <img
                src={attachment.fileUrl}
                alt={`${alt} ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {idx === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    +{images.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




export const ProductMedia: React.FC<ProductMediaProps> = ({ media, alt }) => {
    if (!media || media.length === 0) {
        return (
            <img
                src="/placeholder.png"
                alt={alt}
                className="h-full w-full object-cover"
            />
        );
    }

    const mainMedia = media[0];

    return (
        <div className="h-full w-full overflow-hidden">
            {/* Yahan 'image_url' ki jagah 'media_url' use karein */}
            {mainMedia.media_type === "video" ? (
                <video
                    src={mainMedia.media_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                />
            ) : (
                <img
                    src={mainMedia.media_url}
                    alt={alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            )}
        </div>
    );
};
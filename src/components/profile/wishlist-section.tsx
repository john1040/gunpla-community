import Link from "next/link";
import { RemoveWishlistButton } from "./remove-wishlist-button";
import { RefreshKitButton } from "./refresh-kit-button";

interface WishlistItem {
  id: string;
  created_at: string;
  kit: {
    id: string;
    name_en: string;
    name_jp: string | null;
    grade: string;
    scale: string;
    product_image: string | null;
    kit_images: { image_url: string }[];
  };
}

interface WishlistSectionProps {
  items: WishlistItem[];
  isOwnProfile: boolean;
  onRemoveFromWishlist?: (kitId: string) => Promise<any>;
  onRefreshKit?: (kitId: string) => Promise<void>;
}

export function WishlistSection({ 
  items, 
  isOwnProfile, 
  onRemoveFromWishlist,
  onRefreshKit 
}: WishlistSectionProps) {
  if (!items.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Wishlist</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No kits in wishlist yet.</p>
        </div>
      </div>
    );
  }

  const needsRefresh = (item: WishlistItem) => item.kit.name_en.startsWith('RG Kit ');

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg overflow-hidden bg-gray-50 transition-all duration-300" data-kit-id={item.kit.id}>
            <Link href={`/kits/${item.kit.id}`} className="block">
              <div className="aspect-video relative bg-gray-200">
                {item.kit.product_image || item.kit.kit_images?.[0]?.image_url ? (
                  <img
                    src={item.kit.product_image || item.kit.kit_images[0].image_url}
                    alt={item.kit.name_en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-2">
                  {item.kit.name_en}
                </h3>
                {item.kit.name_jp && (
                  <p className="text-sm text-gray-600 mb-2">{item.kit.name_jp}</p>
                )}
                <div className="flex gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    {item.kit.grade}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    {item.kit.scale}
                  </span>
                </div>
              </div>
            </Link>
            
            {isOwnProfile && (
              <div className="px-4 pb-4 flex justify-between items-center">
                {onRemoveFromWishlist && (
                  <RemoveWishlistButton
                    kitId={item.kit.id}
                    onRemove={onRemoveFromWishlist}
                  />
                )}
                {onRefreshKit && needsRefresh(item) && (
                  <RefreshKitButton
                    kitId={item.kit.id}
                    onRefresh={onRefreshKit}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
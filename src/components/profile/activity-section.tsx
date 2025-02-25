import Link from "next/link";

interface Rating {
  id: string;
  rating: number;
  created_at: string;
  kit: {
    id: string;
    name_en: string;
    grade: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  kit: {
    id: string;
    name_en: string;
    grade: string;
  };
}

interface ActivitySectionProps {
  ratings: Rating[];
  comments: Comment[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      ))}
    </div>
  );
}

export function ActivitySection({ ratings, comments }: ActivitySectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ratings Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Ratings</h3>
          {ratings.length === 0 ? (
            <p className="text-gray-500">No ratings yet</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="border rounded p-3 hover:bg-gray-50 transition-colors"
                >
                  <Link href={`/kits/${rating.kit.id}`} className="block">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{rating.kit.name_en}</h4>
                        <p className="text-sm text-gray-600">{rating.kit.grade}</p>
                      </div>
                      <StarRating rating={rating.rating} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(rating.created_at)}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
          {comments.length === 0 ? (
            <p className="text-gray-500">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border rounded p-3 hover:bg-gray-50 transition-colors"
                >
                  <Link href={`/kits/${comment.kit.id}`} className="block">
                    <div className="mb-2">
                      <h4 className="font-medium">{comment.kit.name_en}</h4>
                      <p className="text-sm text-gray-600">{comment.kit.grade}</p>
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">{comment.content}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
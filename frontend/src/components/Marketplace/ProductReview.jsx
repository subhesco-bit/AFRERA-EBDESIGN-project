/**
 * Product Review Component
 * Allows users to review products with ratings and comments
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Star } from 'lucide-react';
import { Badge } from '../ui/badge';

const ProductReview = ({ productId, userId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userReview, setUserReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
    checkUserReview();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/v1/marketplace/reviews/product/${productId}`);
      const data = await response.json();
      setReviews(data.data.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/v1/marketplace/reviews/product/${productId}/stats`);
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkUserReview = async () => {
    try {
      const response = await fetch(`/api/v1/marketplace/reviews/user`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await response.json();
      const userReviews = data.data.reviews.filter(r => r.product_id === productId);
      setHasReviewed(userReviews.length > 0);
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const submitReview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/marketplace/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          productId,
          ...userReview
        })
      });
      const data = await response.json();
      if (data.success) {
        setUserReview({ rating: 5, title: '', comment: '' });
        setHasReviewed(true);
        loadReviews();
        loadStats();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      await fetch(`/api/v1/marketplace/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      loadReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer' : ''}`}
        onClick={() => interactive && onRate(star)}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Review Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="flex justify-center my-2">{renderStars(Math.round(stats.averageRating))}</div>
                <div className="text-sm text-gray-600">{stats.totalReviews} reviews</div>
              </div>
              <div className="col-span-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{stars} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${(stats.ratingDistribution[stars] / stats.totalReviews) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right">{stats.ratingDistribution[stars]}</span>
                  </div>
                ))}
              </div>
            </div>
            {stats.verifiedPurchaseCount > 0 && (
              <Badge variant="secondary" className="mt-4">
                {stats.verifiedPurchaseCount} verified purchases
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Write Review */}
      {!hasReviewed && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {renderStars(userReview.rating, true, (rating) => setUserReview({ ...userReview, rating }))}
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={userReview.title}
                onChange={(e) => setUserReview({ ...userReview, title: e.target.value })}
                placeholder="Summarize your experience"
              />
            </div>
            <div>
              <Label>Review</Label>
              <Textarea
                value={userReview.comment}
                onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                placeholder="Share your thoughts about this product"
                rows={4}
              />
            </div>
            <Button onClick={submitReview} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{review.user_name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {renderStars(review.rating)}
                        {review.verified_purchase && (
                          <Badge variant="outline" className="text-xs">Verified Purchase</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.title && <div className="font-medium mt-2">{review.title}</div>}
                  <p className="text-gray-700 mt-1">{review.comment}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markHelpful(review.id)}
                    >
                      👍 Helpful ({review.helpful_count})
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReview;

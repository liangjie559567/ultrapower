interface FeedbackResponse {
  skillId: string;
  rating: 'helpful' | 'not_helpful' | 'partially_helpful';
  comment?: string;
  timestamp: number;
}

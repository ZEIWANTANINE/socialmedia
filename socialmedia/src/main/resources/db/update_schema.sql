-- Đảm bảo bảng comments có liên kết đúng tới post và user
ALTER TABLE comments
ADD CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Đảm bảo bảng likes có liên kết đúng tới post và user
ALTER TABLE likes
ADD CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Tạo chỉ mục cho cột user_id và post_id trong bảng comments để tăng tốc truy vấn
CREATE INDEX idx_comment_post ON comments(post_id);
CREATE INDEX idx_comment_user ON comments(user_id);

-- Tạo chỉ mục cho cột user_id và post_id trong bảng likes để tăng tốc truy vấn
CREATE INDEX idx_like_post ON likes(post_id);
CREATE INDEX idx_like_user ON likes(user_id);

-- Đảm bảo rằng mỗi người dùng chỉ có thể like một bài viết một lần
ALTER TABLE likes
ADD UNIQUE INDEX unique_like_user_post (user_id, post_id); 
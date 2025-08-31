-- =====================================================
-- ADD MISSING TABLES FOR SCORE CONFLICTS & CHALLENGES
-- Run this after your main database-reset.sql
-- =====================================================

-- Score Conflicts Table
CREATE TABLE score_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES match_fixtures(id) ON DELETE CASCADE,
    first_submission_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    conflicting_submission JSONB NOT NULL,
    conflicting_user_id UUID NOT NULL REFERENCES profiles(id),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Score Challenges Table  
CREATE TABLE score_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES match_fixtures(id) ON DELETE CASCADE,
    original_result_id UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    challenger_id UUID NOT NULL REFERENCES profiles(id),
    challenged_pair1_score INTEGER NOT NULL CHECK (challenged_pair1_score >= 0),
    challenged_pair2_score INTEGER NOT NULL CHECK (challenged_pair2_score >= 0),
    challenge_reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Add RLS policies for score conflicts
ALTER TABLE score_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view score conflicts" ON score_conflicts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Players can create score conflicts" ON score_conflicts FOR INSERT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage score conflicts" ON score_conflicts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add RLS policies for score challenges  
ALTER TABLE score_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view score challenges" ON score_challenges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Players can create score challenges" ON score_challenges FOR INSERT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage score challenges" ON score_challenges FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add indexes for performance
CREATE INDEX idx_score_conflicts_fixture_id ON score_conflicts(fixture_id);
CREATE INDEX idx_score_conflicts_resolved ON score_conflicts(resolved);
CREATE INDEX idx_score_challenges_fixture_id ON score_challenges(fixture_id);
CREATE INDEX idx_score_challenges_status ON score_challenges(status);

SELECT 'Missing tables added successfully! ✅' as status;
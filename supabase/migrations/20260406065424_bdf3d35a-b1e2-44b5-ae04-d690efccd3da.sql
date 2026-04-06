CREATE TABLE public.compliance_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own compliance" ON public.compliance_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compliance" ON public.compliance_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compliance" ON public.compliance_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compliance" ON public.compliance_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON public.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
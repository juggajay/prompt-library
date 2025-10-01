import { Edit, Trash2, Copy, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Prompt } from '../../types';
import { formatDate } from '../../lib/utils';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
}: PromptCardProps) {
  return (
    <Card className="group hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-fuchsia-400 group-hover:bg-clip-text transition-all">
            {prompt.title}
          </CardTitle>
          <button
            onClick={() => onToggleFavorite(prompt.id, !prompt.is_favorite)}
            className="flex-shrink-0 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                prompt.is_favorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400'
              }`}
            />
          </button>
        </div>
        <Badge variant="default">{prompt.category}</Badge>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-300 line-clamp-3 mb-3">
          {prompt.description || prompt.prompt_text}
        </p>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(prompt.id)}
              className="flex items-center gap-1 bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(prompt.id)}
              className="flex items-center gap-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onCopy(prompt.prompt_text)}
            className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </Button>
        </div>

        <div className="text-xs text-gray-400 w-full">
          Used {prompt.use_count} times • {formatDate(prompt.created_at)}
        </div>
      </CardFooter>
    </Card>
  );
}

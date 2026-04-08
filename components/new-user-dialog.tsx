'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface NewUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
  onError: (message: string, validationOutput?: string) => void;
}

export function NewUserDialog({ isOpen, onClose, onSuccess, onError }: NewUserDialogProps) {
  const [filename, setFilename] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Clear previous errors
    setError('');

    // Basic validation
    if (!filename.trim()) {
      setError('Filename is required');
      return;
    }

    // Check for spaces
    if (/\s/.test(filename)) {
      setError('Filename cannot contain spaces');
      return;
    }

    setIsCreating(true);

    try {
      const { createNewUser } = await import('@/lib/api');
      const result = await createNewUser(filename);

      if (result.status === 'exists') {
        setError('User already exists');
        setIsCreating(false);
        return;
      }

      if (result.status === 'validation_failed') {
        setIsCreating(false);
        onClose();
        onError(result.message, result.validationError || result.validationOutput);
        return;
      }

      // Success
      setIsCreating(false);
      setFilename('');
      onClose();
      onSuccess(filename.split('.')[0].toLowerCase());
    } catch (err: any) {
      setIsCreating(false);
      setError(err.message || 'Failed to create user');
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFilename('');
      setError('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Enter a username for the new FreeRADIUS user file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Username</Label>
            <Input
              id="filename"
              placeholder="e.g., prince, user1, testuser"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              • Letters and numbers only (no spaces)<br />
              • Will be converted to lowercase<br />
              • Extensions will be ignored
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !filename.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { createContext, ReactNode, useCallback, useContext, useState, useMemo, startTransition } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageEditor from '@unlayer/react-image-editor';
import { getImageSizeFromFile, readAsDataUrl } from "@/lib/image-reader";
import { cn } from "cn";
import { Edit, Send, SendToBack } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { toast } from "@/components/ui/toast";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImageExtension";
import { useAuth } from "@/components/AuthProvider";

interface ImageItem {
  origin: File
  dataUrl: string
  modified: File | null
}

interface ImageContext {
  current: ImageItem | null
  selectImage: (file: File) => void
}

const ImageContext = createContext<ImageContext>({
  current: null,
  selectImage: () => { throw new Error('ImageContext not found!')}
})

export const ImageProvider = ({ children }: { children: ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { state: authState } = useAuth();
  const isMobile = useIsMobile()
  const [current, setCurrent] = useState<ImageItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const selectImage = useCallback((file: File) => {
    readAsDataUrl(file).then((dataUrl) => {
      setCurrent({
        origin: file,
        dataUrl,
        modified: null
      })
    })
  }, [])

  const recoverOrigin = useCallback(() => {
    if (!current) return
    selectImage(current?.origin)
  }, [current])

  const cleanUp = useCallback(() => {
    setCurrent(null)
    setIsEditing(false)
  }, [])

  const handleOpenChange = useCallback((flag: boolean) => {
    if (flag) return
    cleanUp()
  }, [cleanUp])

  const uploadImage = useCallback(async () => {
    if (!current) return
    const file = current.modified ?? current.origin
    if (!file) return

    if (authState.status === 'loading') {
      toast.add({
        type: 'info',
        description: 'Still checking your sign-in status. Please try again.',
      })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const size = await getImageSizeFromFile(file)
    const authenticated = authState.status === 'authenticated'

    const uploadPromise = fetch(authenticated ? '/api/resources' : '/image', {
      method: authenticated ? 'POST' : 'PUT',
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json() as
          | { ok: true; key: string; url: string }
          | { ok: true; resource: { resourceId: string; key: string; url: string } }
          | { ok: false; message?: string }

        if (!res.ok) {
          throw new Error(('message' in data && data.message) || 'Upload failed')
        }
        if (!data.ok) {
          throw new Error(data.message ?? 'Upload failed')
        }
        return data
      })
      .then((data) => {
        const result = 'resource' in data
          ? { key: data.resource.key, url: data.resource.url }
          : { key: data.key, url: data.url }

        editor.update(() => {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            key: result.key,
            url: result.url,
            size,
          })
        })

        return {
          key: result.key
        }
      })

    toast.promise(uploadPromise, {
      loading: 'Uploading',
      success: (data) => `${data.key} created`,
      error: 'Create failed'
    })

    uploadPromise.finally(() => {
      cleanUp()
    })
  }, [current, editor, authState.status])

  const memorizedValue = useMemo(() => ({
    current,
    selectImage,
  }), [current, selectImage])

  return <ImageContext value={memorizedValue}>
    {current && <Drawer
      open
      onOpenChange={handleOpenChange}
      disablePointerDismissal
      showSwipeHandle
      swipeDirection={isMobile ? 'down' : 'right'}
    >
      <DrawerContent className={cn(!isMobile && "w-[70vw]")}>
        <DrawerHeader className="mb-5">
          <DrawerTitle>Edit Image</DrawerTitle>
          <DrawerDescription>You can edit image before uploading.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {!isEditing && <div>
            <div className="rounded border border-slate-300 p-1 max-h-80 overflow-y-auto">
              <img
                src={current.dataUrl}
                className="mx-auto min-w-50"
              />
            </div>
            <div className="flex justify-between space-x-5 p-5">
              <div className="flex-1 flex flex-col space-y-1">
                <Button
                  variant="outline"
                  className="flex-1 "
                  onClick={() => setIsEditing(true)}
                ><Edit></Edit>Edit</Button>
                {current.modified && <Button
                  variant="outline"
                  className="flex-1 "
                  onClick={recoverOrigin}
                ><SendToBack></SendToBack> Recover</Button>}
              </div>
              <Button
                variant="outline"
                className="flex-1 py-10"
                onClick={uploadImage}
              ><Send></Send>Use it now</Button>
              <Button
                variant="destructive"
                className="flex-1 py-10"
                onClick={cleanUp}
              >Cancel</Button>
            </div>
          </div>}
          {isEditing && <div>
            <ImageEditor
              minHeight={400}
              style={Object.assign(isMobile ? {
                maxHeight: '450px'
              } : {}, {
                padding: '10px',
                border: '1px solid var(--color-slate-300)',
                borderRadius: '8px'
              })}
              image={current.dataUrl}
              onSave={({ blob, dataUrl }) => {
                setIsEditing(false)
                setCurrent(prev => ({
                  ...prev as ImageItem,
                  modified: new File([blob], prev!.origin.name, {
                    type: prev!.origin.type,
                    lastModified: Date.now()
                  }),
                  dataUrl
                }))
              }}
              onCancel={() =>setIsEditing(false)}
            />
          </div>}
        </div>
      </DrawerContent>
    </Drawer>}
    {children}
  </ImageContext>
}

export const useImage = () => useContext(ImageContext)

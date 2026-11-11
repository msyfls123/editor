import { createContext, ReactNode, useCallback, useContext, useState, useMemo, startTransition } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageEditor from '@unlayer/react-image-editor';
import { readAsDataUrl } from "@/lib/image-reader";
import { cn } from "cn";

interface ImageItem {
  origin: File
  dataUrl: string
  modified: Blob | null
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
  const isMobile = useIsMobile()
  const [current, setCurrent] = useState<ImageItem | null>(null)

  const selectImage = useCallback((file: File) => {
    readAsDataUrl(file).then((dataUrl) => {

      setCurrent({
        origin: file,
        dataUrl,
        modified: null
      })
    })

  }, [])

  const handleOpenChange = useCallback((flag: boolean) => {
    if (flag) return
    setCurrent(null)
  }, [])

  const memorizedValue = useMemo(() => ({
    current,
    selectImage,
  }), [current, selectImage])

  return <ImageContext value={memorizedValue}>
    {current && <Drawer open onOpenChange={handleOpenChange} disablePointerDismissal showSwipeHandle swipeDirection={isMobile ? 'down' : 'right'}>
      <DrawerContent className={cn(!isMobile && "w-[70vw] text-")}>
        <DrawerHeader>
          <DrawerTitle>Edit Image</DrawerTitle>
          <DrawerDescription>You can edit image before uploading.</DrawerDescription>
          <div>
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
              console.log(blob, dataUrl, blob.size, dataUrl.length)
              // setCurrent(prev => ({ ...prev as ImageItem, modified: blob, dataUrl }))
            }}
            onCancel={() => setCurrent(null)}
            />
          </div>
          <DrawerFooter>
            <Button>Confirm</Button>
            <DrawerClose render={<Button variant="outline">Cancel</Button>} />
          </DrawerFooter>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>}
    {children}
  </ImageContext>
}

export const useImage = () => useContext(ImageContext)

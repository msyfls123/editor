import { Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImage } from "../media/Image";

export function ImageButton() {
  const { selectImage } = useImage();
  return (
    <Button variant="outline" className="relative">
      <Image />
      <input
        className="absolute opacity-0 left-0 top-0 w-full h-full"
        accept="image/jpeg,image/png,image/gif"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            selectImage(file)
          }
        }}
      ></input>
    </Button>
  )
}

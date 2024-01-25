import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type MouseEvent } from 'react';
import { useFileDropperContext } from '../contexts/fileDropper';
import { CircularProgress, Stack } from '@mui/material';

const SEARCH_ENDPOINT = 'https://tapto.wizzo.dev/steamgriddb/api/search/';
const IMAGE_ENDPOINT = 'https://tapto.wizzo.dev/steamgriddb/api/image/';

interface ImageSearchResult {
  gameName: string;
  imageUrl: string;
  thumbnailUrl: string;
}

async function searchImage(query: string): Promise<ImageSearchResult[]> {
  return fetch(SEARCH_ENDPOINT + encodeURIComponent(query))
    .then((res) => {
      return res.json() as Promise<ImageSearchResult[]>;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}

async function getImage(cdnUrl: string): Promise<File> {
  const proxyUrl = IMAGE_ENDPOINT + cdnUrl.replace('https://', '');
  return fetch(proxyUrl).then(async (r) => {
    const blob = await r.blob();
    const filename = proxyUrl.split('/').pop() || 'image.png';
    return new File([blob], filename, { type: blob.type });
  });
}

export function ImageSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { files, setFiles } = useFileDropperContext();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const addImage = async (
    e: MouseEvent<HTMLImageElement, MouseEvent>,
    url: string,
  ) => {
    const currentIndex = files.length;
    setOpen(false);
    setFiles([...files, (e.target as HTMLImageElement).src]);
    getImage(url).then((file) => {
      files[currentIndex] = file;
      const newFiles = [...files];
      setFiles(newFiles);
    });
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          height: '70%',
          boxShadow: 24,
          p: 4,
          color: 'text.primary',
          overflow: 'scroll',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing="10px"
            sx={{ justifyContent: 'center' }}
          >
            <TextField
              label="Game name"
              value={searchQuery}
              onChange={(evt) => setSearchQuery(evt.target.value)}
              style={{ width: '30%' }}
            />
            <Button
              variant="contained"
              onClick={() => {
                setSearchResults([]);
                setSearching(true);
                searchImage(searchQuery).then((res) => {
                  setSearching(false);
                  setSearchResults(res);
                });
              }}
            >
              {searching ? <CircularProgress color="secondary" /> : 'Search'}
            </Button>
          </Stack>
          <Typography variant="h3">
            {searchResults.length > 0 ? searchResults[0].gameName : ''}
          </Typography>
          <Grid container spacing={1}>
            {searchResults.map((result) => (
              <Grid item xs={3}>
                <img
                  src={result.thumbnailUrl}
                  onClick={(e) => addImage(e, result.imageUrl)}
                  style={{ cursor: 'pointer' }}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>
    </Modal>
  );
}

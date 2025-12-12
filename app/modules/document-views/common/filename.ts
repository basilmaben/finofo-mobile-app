export const getFilename = (url?: string | null) => {
  if (!url) {
    return '- No file uploaded -';
  }
  
  const lastSlashSection = url.split('/').pop() || url;
  const filename = lastSlashSection.split('?').shift() || lastSlashSection;
  
  if (filename.length <= 38) {
    return filename;
  }
  return `${filename.slice(0, 13)}...${filename.slice(-13)}`;
}

export const getFileExtension = (url?: string | null) => {
  if (!url) {
    return null;
  }
  const filename = getFilename(url);
  const ext = filename.split('.').pop();
  if (!ext) {
    return null;
  }
  return ext;
}

export const getFileIcon = (url?: string | null) => {
  if (!url) {
    return 'cloud-question';
  }
  const ext = getFileExtension(url);
  if (!ext) {
    return 'cloud-question';
  }
  switch(ext) {
    case 'jpg':
    case 'jpeg':
      return 'file-jpg-box';
    case 'pdf':
      return 'file-pdf-box';
    default:
      return 'cloud-question';
  }
}
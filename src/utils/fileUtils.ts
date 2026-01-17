/**
 * Utility functions for file operations
 */

/**
 * Saves data as a JSON file and prompts the user to select a save location
 * 
 * @param data The data to be saved as JSON
 * @param defaultFilename Default filename suggestion for the save dialog
 * @returns Promise that resolves when save is complete
 */
export const saveAsJson = async (data: any, defaultFilename: string = 'config.json'): Promise<void> => {
  try {
    // Convert data to a formatted JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a FileSystemWritableFileStream to write to
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: defaultFilename,
      types: [
        {
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });
    
    // Create a FileSystemWritableFileStream to write to
    const writable = await fileHandle.createWritable();
    
    // Write the contents of the file
    await writable.write(blob);
    
    // Close the file and write the contents to disk
    await writable.close();
    
    return Promise.resolve();
  } catch (error) {
    // If user cancels the save dialog, this will catch the exception
    if ((error as Error).name !== 'AbortError') {
      console.error('Error saving file:', error);
    }
    return Promise.reject(error);
  }
};

/**
 * Fallback method for browsers that don't support the File System Access API
 * Creates a download of the JSON data
 * 
 * @param data The data to be saved as JSON
 * @param filename Default filename for the download
 */
export const downloadJson = (data: any, filename: string = 'config.json'): void => {
  // Convert data to a JSON string
  const jsonString = JSON.stringify(data, null, 2);
  
  // Create a Blob with the JSON data
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append the link to the body, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Save JSON data with browser detection for the best available method
 * 
 * @param data The data to be saved
 * @param filename Default filename suggestion
 * @returns Promise that resolves when save is complete
 */
export const saveJsonFile = async (data: any, filename: string = 'config.json'): Promise<void> => {
  try {
    // Check if the File System Access API is available
    if ('showSaveFilePicker' in window) {
      return saveAsJson(data, filename);
    } else {
      // Fallback for browsers that don't support the File System Access API
      downloadJson(data, filename);
      return Promise.resolve();
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return Promise.reject(error);
  }
};
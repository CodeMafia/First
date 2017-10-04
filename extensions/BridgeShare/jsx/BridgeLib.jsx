/**************************************************************************************************
* BridgeLib.js : Contains code for converting RAW to JPEGs using Bridge ExtendScript APIs
* 
* $Id: /Bridge/main/third_party/cep/experimental/BridgeShare/jsx/BridgeLib.js $
* $Author: siddsing $
*
**************************************************************************************************
*
* ADOBE CONFIDENTIAL
*
********************
*
* Copyright 2003-2017 Adobe Systems Incorporated.
* All Rights Reserved.
* 
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property
* laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
*
**************************************************************************************************/



/**
 * Converts a RAW file to JPEG after validation 
 * @param fileId id of the RAW file which needs to be converted to JPEG
 * @param fileName Name of the file in local file system which needs to be converted to JPEG
 * With new CEP Version, For all type of RAW\Non-RAW files, we are using generating previews Using Bridge ExtendScript APIS.
 * These preview JPEG are copied to the temp folder for upload.
 * @return status of conversion, Id of file and path of converted file seperated by '$ sign 
 *         eg. 'Success$123445$C:\Converted\File.jpg 
 *			   'Failure$123456$Can not create Folder
 */
 
function PrepareImageForUpload(fileId, fileName)
{
	var currentSyncModeSetting = app.synchronousMode;	
	var isFolderCreated = false;
	var outputPath = '';
	
	var thumbNailFromSelection = GetThumbNailByFileName(fileName);
	
	if(thumbNailFromSelection == null)
	{
		return PrepareResonse('failure', fileId, 'File Error : Can not find file from thumbnail Selection');
	}
	
	
	var file = thumbNailFromSelection.spec;
	if(!thumbNailFromSelection.spec)
	{
		return PrepareResonse('failure', fileId, 'File Error : File selected does not exist.');
	}
	app.synchronousMode = true;
	
	//If file is not a valid images file, return Failed Status
	//Example of Invalid files: txts, pdfs etc
	if(!IsValidImageFile(thumbNailFromSelection))
	{
		return PrepareResonse('failure', fileId, 'Invalid Image Error: The selected Image is not Valid. ');
	}
	
    var bitmapObjectOfPreviewSize =  thumbNailFromSelection.core.preview.preview;  
	//create a temp folder
	var userDataFolderPath = Folder.userData;
	var appFolderName = 'BridgeShare';
	var appAbsoluteFolderPath ='';


	if( Folder.fs == "Windows" )
	{
		appAbsoluteFolderPath = userDataFolderPath + "\\" + appFolderName;
	} 
	else 
	{
		appAbsoluteFolderPath = userDataFolderPath + "//" + appFolderName;
	}

	var outputFolder = new Folder(appAbsoluteFolderPath);
	isFolderCreated = outputFolder.exists;

	if(!outputFolder.exists)
	{	
		isFolderCreated = outputFolder.create();
	}

	if(!isFolderCreated)
	{
	   return PrepareResonse('failure',fileId,'Folder Creation error : Not able to create folder using Bridge APIs');	  
	}
	 
	var outputPath = '';
	
	if( Folder.fs == "Windows" )
	{
		outputPath = outputFolder + "\\" + file.name+ ".jpg";;
	} 
	else 
	{
		outputPath = outputFolder + "//" + file.name + ".jpg";;
	}

	var exportedJPG = new File (outputPath);
	
	//Converting to JPEG with highest quality size
	bitmapObjectOfPreviewSize.exportTo(exportedJPG, 100);   

	var outputFile = new File(exportedJPG.fsName);
	
	if(!outputFile.exists)
	{
		return PrepareResonse('failure',fileId,'File Error : Can not Export JPEG file of the Thumbnail');	  
	}
	app.synchronousMode = currentSyncModeSetting;
	
	return PrepareResonse('success',fileId,exportedJPG.fsName);	
}



/**
 * Deletes the images from the appdata\Application. Called after the conversion
 */
function ClearTempImages()
{
	var baseFolder = Folder.userData;
	var appFolderName = 'BridgeShare';
	var appAbsoluteFolderPath ='';


	if( Folder.fs == "Windows" )
	{
		appAbsoluteFolderPath = baseFolder + "\\" + appFolderName;
	} 
	else 
	{
		appAbsoluteFolderPath = baseFolder + "//" + appFolderName;
	}

	var folder = new Folder(appAbsoluteFolderPath);
	
	if(folder == null || !folder.exists)
	{
		return;
	}

	var files = folder.getFiles('*');
	
	if(files == null || files.length == 0)
	{
		return;
	}

	for(var i=0;i<files.length;i++)
	{
		var f = files[i];
		f.remove();
	} 
}



/**
 * Returns the list of selected files and their paths
 * @param status Conversion status - success or failure
 * @param fileID id of the file
 * @param message Error response or file path
 *
 * @return stats incoming params seperated by $
 */
function GetThumbNailByFileName(fileName)
{
	var thumb = null;
	var currentSelectedFilesArray = app.document.selections;
	
	if(currentSelectedFilesArray == null)
		return thumb;
	
	for(var i=0;i< currentSelectedFilesArray.length;i++)
	{
		if(currentSelectedFilesArray[i].name == fileName)
		{
			thumb =  currentSelectedFilesArray[i];		
			break;
		}
	}
	return thumb;
}



/**
 * Response to be sent to caller after conversion
 * @param status Conversion status - success or failure
 * @param fileID id of the file
 * @param message Error response or file path
 *
 * @return stats incoming params seperated by $
 */
function PrepareResonse(status, fileID, message)
{
	return status + '$' + fileID + '$' + message;	
}



/**
 * Validate if the file is valid and can be converted
 * @param thumbnail Thumbnail object of the file which needs to be converted
 *
 * @return true if the file is valid or false otherwise
 */
function IsValidImageFile(thumbnail)
{
	if(thumbnail == null)
		return false;
	
	if(thumbnail.core == null || thumbnail.core.itemContent == null || thumbnail.core.itemContent.mimeType == null)
		return false;
	
	if(thumbnail.core.preview.hasHighQualityPreview == false )
		return false;
	
	var mimeType =  thumbnail.core.itemContent.mimeType.toLowerCase();  
	
	//if mimeType does not contain image then it is not valid image
	if(mimeType.indexOf('image')=== -1) 
	{
		return false;
	}	
	return true;
}
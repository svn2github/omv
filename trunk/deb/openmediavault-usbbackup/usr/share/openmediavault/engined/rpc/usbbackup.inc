<?php
/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2015 Volker Theile
 *
 * OpenMediaVault is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * OpenMediaVault is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with OpenMediaVault. If not, see <http://www.gnu.org/licenses/>.
 */
require_once("openmediavault/object.inc");
require_once("openmediavault/config.inc");
require_once("openmediavault/error.inc");
require_once("openmediavault/rpcservice.inc");
require_once("openmediavault/notify.inc");

class OMVRpcServiceUsbBackup extends OMVRpcServiceAbstract {
	/**
	 * Get the RPC service name.
	 */
	public function getName() {
		return "UsbBackup";
	}

	/**
	 * Initialize the RPC service.
	 */
	public function initialize() {
		$this->registerMethod("getCandidates");
		$this->registerMethod("getList");
		$this->registerMethod("get");
		$this->registerMethod("set");
		$this->registerMethod("delete");
		$this->registerMethod("execute");
	}

	/**
	 * Get list of USB volumes that can be used for backup jobs.
	 * @param params The method parameters.
	 * @param context The context of the caller.
	 * @return An array containing objects with the following fields:
	 *   \em uuid, \em devicefile and \em description.
	 *   The field \em uuid is the mount point configuration object UUID.
	 * @throw E_MISC_FAILURE
	 * @throw E_MISC_DEVICE_NOT_FOUND
	 */
	public function getCandidates($params, $context) {
		global $xmlConfig;
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Get list of all detected filesystems. Note, the list may also
		// contain RAID and LVM volumes, so the list must be filtered.
		if (FALSE === ($objects = OMVFilesystems::enumerate())) {
			throw new OMVException(OMVErrorMsg::E_MISC_FAILURE,
			  gettext("Failed to get filesystems"));
		}
		// Collect volumes that are candidates for a backup job.
		$result = array();
		foreach ($objects as $objectk => $objectv) {
			// Skip filesystem we do not support.
			if (!OMVFilesystems::isSupported($objectv['type']))
				continue;
			// Skip the device where the operating system is installed on.
			if (OMVSystem::isRootDeviceFile($objectv['devicefile']))
				continue;
			// Get the filesystem backend.
			$fsb = OMVFilesystems::getBackendByType($objectv['type']);
			if (is_null($fsb)) {
				throw new OMVException(OMVErrorMsg::E_MISC_FAILURE,
				  sprintf("No filesystem backend exists for '%s'",
				  $objectv['type']));
			}
			// Skip filesystems that support union mounts, e.g. UnionFS,
			// aufs or mhddfs. Such filesystems do not have a device file
			// which is required to write the UDEV rule.
			if (!$fsb->hasDeviceFile())
				continue;
			// Get the filesystem implementation.
			$fs = $fsb->getImpl($objectv['devicefile']);
			if (is_null($fs) || !$fs->exists()) {
				throw new OMVException(OMVErrorMsg::E_MISC_FAILURE, sprintf(
				  "Failed to get the '%s' filesystem implementation or '%s' ".
				  "does not exist", $fsb->getType(), $objectv['devicefile']));
			}
			// Get the storage device containing the filesystem.
			if (FALSE === ($storageDeviceFile = $fs->getStorageDeviceFile())) {
//				throw new OMVException(OMVErrorMsg::E_MISC_FAILURE, sprintf(
//				  gettext("Failed to get storage device file from '%s'"),
//				  $objectv['devicefile']));
				continue;
			}
			$sd = OMVStorageDeviceFactory::get($storageDeviceFile);
			if (is_null($sd) || !$sd->exists()) {
				throw new OMVException(OMVErrorMsg::E_MISC_DEVICE_NOT_FOUND,
			  	  $storageDeviceFile);
			}
			// Skip everything which is not an USB or eSATA device or is a
			// read-only medium.
			if (!($sd->isUsb() || $sd->isAta()) || $sd->isReadOnly())
				continue;
			// Prepare result object.
			$result[] = array(
				"uuid" => $objectv['uuid'],
				"devicefile" => $objectv['devicefile'],
				"label" => $objectv['label'],
				"type" => $objectv['type'],
				"description" => $sd->getDescription()
			);
		}
		return $result;
	}

	/**
	 * Get list of USB backup job configuration objects.
	 * @param data An array containing the following fields:
	 *   \em start The index where to start.
	 *   \em limit The number of objects to process.
	 *   \em sortfield The name of the column used to sort.
	 *   \em sortdir The sort direction, ASC or DESC.
	 * @return An array containing the requested objects. The field \em total
	 *   contains the total number of objects, \em data contains the object
	 *   array. An exception will be thrown in case of an error.
	 * @throw E_CONFIG_GET_OBJECT_FAILED
	 */
	public function getList($params, $context) {
		global $xmlConfig;
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Validate the parameters of the RPC service method.
		$this->validateMethodParams($params, '{
			  "type":"object",
			  "properties":{
				  "start":{"type":"integer"},
				  "limit":{'.$GLOBALS['OMV_JSONSCHEMA_COUNTFIELD'].'},
				  "sortfield":{'.$GLOBALS['OMV_JSONSCHEMA_SORTFIELD'].'},
				  "sortdir":{'.$GLOBALS['OMV_JSONSCHEMA_SORTDIR'].'}
			  }
		  }');
		// Get the configuration objects.
		$xpath = "//services/usbbackup/jobs/job";
		$objects = $xmlConfig->getList($xpath);
		if(is_null($objects)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
			  $xpath);
		}
		// Add additional share informations.
		foreach($objects as $objectk => &$objectv) {
			$objectv['sharedfoldername'] = gettext("n/a");
			// Get the shared folder configuration object.
			$sfobject = $xmlConfig->get("//system/shares/sharedfolder[" .
			  "uuid='{$objectv['sharedfolderref']}']");
			if(!is_null($sfobject) && !empty($sfobject)) {
				$objectv['sharedfoldername'] = $sfobject['name'];
			}
			// Get job status.
			$objectv['running'] = file_exists(sprintf("/var/run/sync-%s",
			  $objectv['fsuuid']));
			// Modify result object.
			$objectv['enable'] = boolvalEx($objectv['enable']);
			$objectv['sendemail'] = boolvalEx($objectv['sendemail']);
			$objectv['usesubdir'] = boolvalEx($objectv['usesubdir']);
			$objectv['recursive'] = boolvalEx($objectv['recursive']);
			$objectv['times'] = boolvalEx($objectv['times']);
			$objectv['compress'] = boolvalEx($objectv['compress']);
			$objectv['archive'] = boolvalEx($objectv['archive']);
			$objectv['delete'] = boolvalEx($objectv['delete']);
			$objectv['quiet'] = boolvalEx($objectv['quiet']);
			$objectv['perms'] = boolvalEx($objectv['perms']);
			$objectv['acls'] = boolvalEx($objectv['acls']);
			$objectv['xattrs'] = boolvalEx($objectv['xattrs']);
		}
		// Filter the result.
		return $this->applyFilter($objects, $params['start'],
		  $params['limit'], $params['sortfield'], $params['sortdir']);
	}

	/**
	 * Get a USB backup job configuration object.
	 * @param params An array containing the following fields:
	 *   \em uuid The UUID of the configuration object.
	 * @param context The context of the caller.
	 * @return The requested configuration object.
	 * @throw E_CONFIG_GET_OBJECT_FAILED
	 */
	function get($params, $context) {
		global $xmlConfig;
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Validate the parameters of the RPC service method.
		$this->validateMethodParams($params, '{
			  "type":"object",
			  "properties":{
				  "uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'}
			  }
		  }');
		// Get the configuration object.
		$xpath = sprintf("//services/usbbackup/jobs/job[uuid='%s']",
		  $params['uuid']);
		$object = $xmlConfig->get($xpath);
		if(is_null($object)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
			  $xpath);
		}
		// Modify result object.
		$object['enable'] = boolvalEx($object['enable']);
		$object['sendemail'] = boolvalEx($object['sendemail']);
		$object['usesubdir'] = boolvalEx($object['usesubdir']);
		$object['recursive'] = boolvalEx($object['recursive']);
		$object['times'] = boolvalEx($object['times']);
		$object['compress'] = boolvalEx($object['compress']);
		$object['archive'] = boolvalEx($object['archive']);
		$object['delete'] = boolvalEx($object['delete']);
		$object['quiet'] = boolvalEx($object['quiet']);
		$object['perms'] = boolvalEx($object['perms']);
		$object['acls'] = boolvalEx($object['acls']);
		$object['xattrs'] = boolvalEx($object['xattrs']);
		$object['partial'] = boolvalEx($object['partial']);
		return $object;
	}

	/**
	 * Set a USB backup job configuration object.
	 * @param params The method parameters.
	 * @param context The context of the caller.
	 * @return The stored configuration object.
	 * @throw E_CONFIG_OBJECT_UNIQUENESS
	 * @throw E_CONFIG_SET_OBJECT_FAILED
	 */
	function set($params, $context) {
		global $xmlConfig;
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Validate the parameters of the RPC service method.
		$this->validateMethodParams($params, '{
			  "type":"object",
			  "properties":{
				  "uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'].'},
				  "enable":{"type":"boolean"},
				  "mode":{"type":"string","enum":["push","pull"]},
				  "sendemail":{"type":"boolean"},
				  "comment":{"type":"string"},
				  "fsuuid":{"type":"string","optional":true},
				  "sharedfolderref":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'},
				  "usesubdir":{"type":"boolean"},
				  "recursive":{"type":"boolean"},
				  "times":{"type":"boolean"},
				  "compress":{"type":"boolean"},
				  "archive":{"type":"boolean"},
				  "delete":{"type":"boolean"},
				  "quiet":{"type":"boolean"},
				  "perms":{"type":"boolean"},
				  "acls":{"type":"boolean"},
				  "xattrs":{"type":"boolean"},
				  "partial":{"type":"boolean"},
				  "extraoptions":{"type":"string"}
			  }
		  }');
		// Prepare the configuration object.
		$object = array(
			"uuid" => ($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ?
			  OMVUtil::uuid() : $params['uuid'],
			"enable" => array_boolval($params, 'enable'),
			"mode" => $params['mode'],
			"sendemail" => array_boolval($params, 'sendemail'),
			"comment" => $params['comment'],
			"fsuuid" => $params['fsuuid'],
			"sharedfolderref" => $params['sharedfolderref'],
			"usesubdir" => array_boolval($params, 'usesubdir'),
			"recursive" => array_boolval($params, 'recursive'),
			"times" => array_boolval($params, 'times'),
			"compress" => array_boolval($params, 'compress'),
			"archive" => array_boolval($params, 'archive'),
			"delete" => array_boolval($params, 'delete'),
			"quiet" => array_boolval($params, 'quiet'),
			"perms" => array_boolval($params, 'perms'),
			"acls" => array_boolval($params, 'acls'),
			"xattrs" => array_boolval($params, 'xattrs'),
			"partial" => array_boolval($params, 'partial'),
			"extraoptions" => $params['extraoptions']
		);
		// Set the configuration object.
		$success = FALSE;
		if($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) {
			// Append object to configuration.
			$success = $xmlConfig->set("//services/usbbackup/jobs",
			  array("job" => $object));
		} else {
			// Update existing configuration object.
			$success = $xmlConfig->replace("//services/usbbackup/jobs/job[" .
			  "uuid='{$params['uuid']}']", $object);
		}
		if(FALSE === $success) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED);
		}
		// Notify configuration changes.
		$dispatcher = &OMVNotifyDispatcher::getInstance();
		$dispatcher->notify(($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ?
		  OMV_NOTIFY_CREATE : OMV_NOTIFY_MODIFY,
		  "org.openmediavault.services.usbbackup.jobs.job", $object);
		// Return the configuration object.
		return $object;
	}

	/**
	 * Delete a backup job configuration object.
	 * @param params An array containing the following fields:
	 *   \em uuid The UUID of the configuration object.
	 * @param context The context of the caller.
	 * @return The deleted configuration object.
	 */
	public function delete($params, $context) {
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Validate the parameters of the RPC service method.
		$this->validateMethodParams($params, '{
			  "type":"object",
			  "properties":{
				  "uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'}
			  }
		  }');
		// Delete the configuration object.
		$xpath = sprintf("//services/usbbackup/jobs/job[uuid='%s']",
		  $params['uuid']);
		return $this->deleteConfigObjectByPath($xpath,
		  "org.openmediavault.services.usbbackup.jobs.job");
	}

	/**
	 * Execute a backup job.
	 * @param params An array containing the following fields:
	 *   \em uuid The UUID of the cron job to execute.
	 * @param context The context of the caller.
	 * @return The name of the background process status file.
	 * @throw E_CONFIG_DIRTY
	 */
	public function execute($params, $context) {
		// Validate the RPC caller context.
		$this->validateMethodContext($context, array(
			  "role" => OMV_ROLE_ADMINISTRATOR
		  ));
		// Validate the parameters of the RPC service method.
		$this->validateMethodParams($params, '{
			  "type":"object",
			  "properties":{
				  "uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'}
			  }
		  }');
		// Check if the module is marked as dirty. This is an indication
		// that the rsync cron script has not been created or updated
		// until now.
		if($this->isModuleDirty("usbbackup")) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_DIRTY);
		}
		// Create a background process.
		$bgStatusFilename = $this->createBgProcStatus();
		$pid = $this->fork();
		if($pid > 0) { // Parent process.
			$this->initializeBgProcStatus($bgStatusFilename, $pid);
			return $bgStatusFilename;
		}
		// Child process.
		try {
			$bgOutputFilename = $this->createBgProcOutput();
			$this->updateBgProcStatus($bgStatusFilename, "outputfilename",
			  $bgOutputFilename);
			// Execute the backup script.
			$cmd = "/bin/sh";
			$cmdArgs = array(sprintf("%s/rsync-%s",
			  $GLOBALS['OMV_USBBACKUP_SCRIPTS_DIR'], $params['uuid']));
			if(FALSE === $this->execve($cmd, $cmdArgs, $bgOutputFilename)) {
				throw new OMVException(OMVErrorMsg::E_EXEC_FAILED,
				  $cmd." ".implode(" ", $cmdArgs), "");
			}
		} catch(Exception $e) {
			$this->finalizeBgProcStatus($bgStatusFilename, "", $e);
			exit(1);
		}
	}
}

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance();
$rpcServiceMgr->registerService(new OMVRpcServiceUsbBackup());
?>

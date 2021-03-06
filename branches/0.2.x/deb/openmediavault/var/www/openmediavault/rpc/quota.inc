<?php
/**
 * This file is part of OpenMediaVault.
 *
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2012 Volker Theile
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
require_once("openmediavault/system.inc");
require_once("openmediavault/functions.inc");
require_once("openmediavault/error.inc");
require_once("openmediavault/util.inc");
require_once("openmediavault/rpc.inc");
require_once("openmediavault/notify.inc");

class QuotaRpc extends OMVRpc {
	public function __construct() {
		$this->methodSchemata = array(
			"get" => array(
				'{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'}'
			),
			"set" => array('{
				"type":"object",
				"properties":{
					"uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'},
					"quota":{
						"type":"array",
						"items":{
							"type":"object",
							"properties":{
								"uuid":{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'},
								"type":{"type":"string","enum":["user","group"]},
								"bhardlimit":{"type":"number","minimum":0},
								"bunit":{"type":"string","enum":["B","KiB",'.
								  '"MiB","GiB","TiB","PiB","EiB"]}
							}
						}
					}
				}
			}'),
			"delete" => array(
				'{'.$GLOBALS['OMV_JSONSCHEMA_UUID'].'}'
			)
		);
	}

    /**
	 * Get the quota for the given filesystem.
	 * @param uuid The UUID of the filesystem.
	 * @return An array containing the requested quota configuration.
	 */
	function get($uuid) {
//		$this->debug(var_export(func_get_args(), TRUE));
		global $xmlConfig;
		// Check permissions
		$this->validateSession();
		if (!$this->hasRole(OMV_ROLE_ADMINISTRATOR)) {
			throw new OMVException(OMVErrorMsg::E_RPC_SERVICE_INVALID_PERMISSION);
		}
		$this->commitSession();
		// Validate method parameters
		$this->validateParams(__METHOD__, func_get_args());
		// Get filesystem details.
		$fs = new OMVFilesystem($uuid);
		if (!$fs->exists()) {
			throw new OMVException(OMVErrorMsg::E_MISC_FAILURE,
			  sprintf(gettext("Filesystem '%s' not found"), $uuid));
		}
		$devicefile = $fs->getDeviceFile();
		// Does any quota configuration exist for the given filesystem?
		$xpath = "//system/storage/filesystem/quota[fsuuid='{$uuid}']";
		$object = $xmlConfig->get($xpath);
		// Prepare result. Iterate over all system users and groups and get
		// their quota configuration for the given filesystem.
		$result = array();
		// Get all user configuration objects.
		$xpath = "//system/usermanagement/users/user";
		$users = $xmlConfig->getList($xpath);
		if (is_null($users)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
			  $xpath);
		}
		foreach ($users as $userk => $userv) {
			// Set default values.
			$resObj = array(
				"type" => "user",
				"uuid" => $userv['uuid'],
				"name" => $userv['name'],
				"bused" => 0,
				"bhardlimit" => 0,
				"bunit" => "MiB"
			);
			// Check if there is any configured quota for the given user.
			if (isset($object['usrquota']) && is_array($object['usrquota'])) {
				foreach ($object['usrquota'] as $usrquotav) {
					if (!array_key_exists('userref', $usrquotav) ||
						($userv['uuid'] !== $usrquotav['userref'])) {
						continue;
					}
					// Get user quotas and get the number of used disk space
					// if available. Note, 'blocks' are given in KiB.
					$sysUser = new OMVSystemUser($userv['name']);
					if (FALSE !== ($quotas = $sysUser->getQuotas())) {
						if (array_key_exists($devicefile, $quotas)) {
							$resObj['bused'] = binary_format(
							  $quotas[$devicefile]['blocks'], array(
							  "fromPrefix" => "KiB"));
						}
					}
					// Convert the quota to a human readable unit. Note, the
					// values are stored a KiB in the configuration.
					$bhardlimit = binary_format($usrquotav['bhardlimit'],
					  array("fromPrefix" => "KiB", "maxPrefix" => "TiB",
					  "indexed" => TRUE));
					$resObj['bhardlimit'] = $bhardlimit['value'];
					$resObj['bunit'] = $bhardlimit['unit'];
				}
			}
			$result[] = $resObj;
		}
		// Get all group configuration objects
		$xpath = "//system/usermanagement/groups/group";
		$groups = $xmlConfig->getList($xpath);
		if (is_null($groups)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
			  $xpath);
		}
		foreach ($groups as $groupk => $groupv) {
			// Set default values.
			$resObj = array(
				"type" => "group",
				"uuid" => $groupv['uuid'],
				"name" => $groupv['name'],
				"bused" => 0,
				"bhardlimit" => 0,
				"bunit" => "MiB"
			);
			// Check if there is any configured quota for the given group.
			if (isset($object['grpquota']) && is_array($object['grpquota'])) {
				foreach ($object['grpquota'] as $grpquotav) {
					if (!array_key_exists('groupref', $grpquotav) ||
						($groupv['uuid'] !== $grpquotav['groupref'])) {
						continue;
					}
					// Get user quotas and get the number of used disk space
					// if available. Note, 'blocks' are given in KiB.
					$sysGroup = new OMVSystemGroup($groupv['name']);
					if (FALSE !== ($quotas = $sysGroup->getQuotas())) {
						if (array_key_exists($devicefile, $quotas)) {
							$resObj['bused'] = binary_format(
							  $quotas[$devicefile]['blocks'], array(
							  "fromPrefix" => "KiB"));
						}
					}
					// Convert the quota to a human readable unit. Note, the
					// values are stored a KiB in the configuration.
					$bhardlimit = binary_format($grpquotav['bhardlimit'],
					  array("fromPrefix" => "KiB", "maxPrefix" => "TiB",
					  "indexed" => TRUE));
					$resObj['bhardlimit'] = $bhardlimit['value'];
					$resObj['bunit'] = $bhardlimit['unit'];
				}
			}
			$result[] = $resObj;
		}
		return $result;
	}

    /**
	 * Set the quota for the given filesystem.
	 * @param data An array containing the fields \em uuid and
     * \em quota. \em uuid is the UUID of the filesystem and
     * \em quota an array of quotas to set.
	 */
	function set($data) {
//		$this->debug(var_export(func_get_args(), TRUE));
		global $xmlConfig;
		// Check permissions
		$this->validateSession();
		if (!$this->hasRole(OMV_ROLE_ADMINISTRATOR)) {
			throw new OMVException(OMVErrorMsg::E_RPC_SERVICE_INVALID_PERMISSION);
		}
		$this->commitSession();
		// Validate method parameters
		$this->validateParams(__METHOD__, func_get_args());
		// Create filesystem quota configuration object.
		$object = array();
		foreach ($data['quota'] as $datak => $datav) {
			$quotaObj = array(
				"bsoftlimit" => 0,
				"bhardlimit" => binary_convert($datav['bhardlimit'],
				  $datav['bunit'], "KiB"),
				"isoftlimit" => 0,
				"ihardlimit" => 0
			);
			switch ($datav['type']) {
			case "user":
				if (!isset($object['usrquota']))
					$object['usrquota'] = array();
				$quotaObj['userref'] = $datav['uuid'];
				$object['usrquota'][] = $quotaObj;
				break;
			case "group":
				if (!isset($object['grpquota']))
					$object['grpquota'] = array();
				$quotaObj['groupref'] = $datav['uuid'];
				$object['grpquota'][] = $quotaObj;
				break;
			}
		}
		// Set configuration object.
		$xpath = "//system/storage/filesystem/quota[fsuuid='{$data['uuid']}']";
		if (FALSE === $xmlConfig->exists($xpath)) {
			// Create a new configuration object.
			$object['uuid'] = OMVUtil::uuid();
			$object['fsuuid'] = $data['uuid'];
			// Append object to configuration.
			$success = $xmlConfig->set("//system/storage/filesystem",
			  array("quota" => $object));
		} else {
			// Get existing configuration object.
			$oldObject = $xmlConfig->get($xpath);
			if (is_null($oldObject)) {
				throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
				  $xpath);
			}
			$object['uuid'] = $oldObject['uuid'];
			$object['fsuuid'] = $oldObject['fsuuid'];
			// Update existing configuration object.
			$success = $xmlConfig->replace($xpath, $object);
		}
		if (FALSE === $success) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED);
		}
		// Save configuration.
		if (FALSE === $xmlConfig->save()) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_SAVE_FAILED,
			  $xmlConfig->getError());
		}
		// Notify configuration changes.
		$dispatcher = &OMVNotifyDispatcher::getInstance();
		$dispatcher->notify(OMV_NOTIFY_MODIFY,
		  "org.openmediavault.system.storage.filesystem.quota", $object);
	}

	/**
	 * Delete a filesystem quota configuration object.
	 */
	function delete($uuid) {
//		$this->debug(var_export(func_get_args(), TRUE));
		global $xmlConfig;
		// Check permissions
		$this->validateSession();
		if (!$this->hasRole(OMV_ROLE_ADMINISTRATOR)) {
			throw new OMVException(OMVErrorMsg::E_RPC_SERVICE_INVALID_PERMISSION);
		}
		$this->commitSession();
		// Validate method parameters
		$this->validateParams(__METHOD__, func_get_args());
		// Get the configuration object
		$xpath = "//system/storage/filesystem/quota[uuid='{$uuid}']";
		$object = $xmlConfig->get($xpath);
		if (is_null($object)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
			  $xpath);
		}
		// Notify configuration changes
		$dispatcher = &OMVNotifyDispatcher::getInstance();
		$dispatcher->notify(OMV_NOTIFY_PREDELETE,
		  "org.openmediavault.system.storage.filesystem.quota", $object);
		// Delete configuration object
		if (FALSE === ($object = $xmlConfig->delete($xpath))) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_OBJECT_NOT_FOUND,
			  $xpath);
		}
		// Save configuration
		if (FALSE === $xmlConfig->save()) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_SAVE_FAILED,
			  $xmlConfig->getError());
		}
		// Notify configuration changes
		$dispatcher->notify(OMV_NOTIFY_DELETE,
		  "org.openmediavault.system.storage.filesystem.quota", $object);
	}
}
?>

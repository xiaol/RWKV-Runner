import {Dropdown, Input, Label, Option, Select, Switch} from '@fluentui/react-components';
import {AddCircle20Regular, DataUsageSettings20Regular, Delete20Regular, Save20Regular} from '@fluentui/react-icons';
import React, {FC} from 'react';
import {Section} from '../components/Section';
import {Labeled} from '../components/Labeled';
import {ToolTipButton} from '../components/ToolTipButton';
import commonStore, {ApiParameters, Device, ModelParameters, Precision} from '../stores/commonStore';
import {observer} from 'mobx-react-lite';
import {toast} from 'react-toastify';
import {ValuedSlider} from '../components/ValuedSlider';
import {NumberInput} from '../components/NumberInput';
import {Page} from '../components/Page';
import {useNavigate} from 'react-router';
import {RunButton} from '../components/RunButton';
import {updateConfig} from '../apis';
import {ConvertModel, FileExists} from '../../wailsjs/go/backend_golang/App';
import manifest from '../../../manifest.json';
import {getStrategy, refreshLocalModels} from '../utils';
import {useTranslation} from 'react-i18next';

export const Configs: FC = observer(() => {
  const {t} = useTranslation();
  const [selectedIndex, setSelectedIndex] = React.useState(commonStore.currentModelConfigIndex);
  const [selectedConfig, setSelectedConfig] = React.useState(commonStore.modelConfigs[selectedIndex]);

  const navigate = useNavigate();

  const updateSelectedIndex = (newIndex: number) => {
    setSelectedIndex(newIndex);
    setSelectedConfig(commonStore.modelConfigs[newIndex]);

    // if you don't want to update the config used by the current startup in real time, comment out this line
    commonStore.setCurrentConfigIndex(newIndex);
  };

  const setSelectedConfigName = (newName: string) => {
    setSelectedConfig({...selectedConfig, name: newName});
  };

  const setSelectedConfigApiParams = (newParams: Partial<ApiParameters>) => {
    setSelectedConfig({
      ...selectedConfig, apiParameters: {
        ...selectedConfig.apiParameters,
        ...newParams
      }
    });
  };

  const setSelectedConfigModelParams = (newParams: Partial<ModelParameters>) => {
    setSelectedConfig({
      ...selectedConfig, modelParameters: {
        ...selectedConfig.modelParameters,
        ...newParams
      }
    });
  };

  const onClickSave = () => {
    commonStore.setModelConfig(selectedIndex, selectedConfig);
    updateConfig({
      max_tokens: selectedConfig.apiParameters.maxResponseToken,
      temperature: selectedConfig.apiParameters.temperature,
      top_p: selectedConfig.apiParameters.topP,
      presence_penalty: selectedConfig.apiParameters.presencePenalty,
      frequency_penalty: selectedConfig.apiParameters.frequencyPenalty
    });
    toast(t('Config Saved'), {autoClose: 300, type: 'success'});
  };

  return (
    <Page title={t('Configs')} content={
      <div className="flex flex-col gap-2 overflow-hidden">
        <div className="flex gap-2 items-center">
          <Dropdown style={{minWidth: 0}} className="grow" value={commonStore.modelConfigs[selectedIndex].name}
                    selectedOptions={[selectedIndex.toString()]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        updateSelectedIndex(Number(data.optionValue));
                      }
                    }}>
            {commonStore.modelConfigs.map((config, index) =>
              <Option key={index} value={index.toString()}>{config.name}</Option>
            )}
          </Dropdown>
          <ToolTipButton desc={t('New Config')} icon={<AddCircle20Regular/>} onClick={() => {
            commonStore.createModelConfig();
            updateSelectedIndex(commonStore.modelConfigs.length - 1);
          }}/>
          <ToolTipButton desc={t('Delete Config')} icon={<Delete20Regular/>} onClick={() => {
            commonStore.deleteModelConfig(selectedIndex);
            updateSelectedIndex(Math.min(selectedIndex, commonStore.modelConfigs.length - 1));
          }}/>
          <ToolTipButton desc={t('Save Config')} icon={<Save20Regular/>} onClick={onClickSave}/>
        </div>
        <div className="flex items-center gap-4">
          <Label>{t('Config Name')}</Label>
          <Input className="grow" value={selectedConfig.name} onChange={(e, data) => {
            setSelectedConfigName(data.value);
          }}/>
        </div>
        <div className="flex flex-col gap-2 overflow-y-hidden">
          <Section
            title={t('Default API Parameters')}
            desc={t('Hover your mouse over the text to view a detailed description. Settings marked with * will take effect immediately after being saved.')}
            content={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Labeled label={t('API Port')} desc={`127.0.0.1:${selectedConfig.apiParameters.apiPort}`} content={
                  <NumberInput value={selectedConfig.apiParameters.apiPort} min={1} max={65535} step={1}
                               onChange={(e, data) => {
                                 setSelectedConfigApiParams({
                                   apiPort: data.value
                                 });
                               }}/>
                }/>
                <Labeled label={t('Max Response Token *')} content={
                  <ValuedSlider value={selectedConfig.apiParameters.maxResponseToken} min={100} max={8100} step={400}
                                input
                                onChange={(e, data) => {
                                  setSelectedConfigApiParams({
                                    maxResponseToken: data.value
                                  });
                                }}/>
                }/>
                <Labeled label={t('Temperature *')} content={
                  <ValuedSlider value={selectedConfig.apiParameters.temperature} min={0} max={2} step={0.1} input
                                onChange={(e, data) => {
                                  setSelectedConfigApiParams({
                                    temperature: data.value
                                  });
                                }}/>
                }/>
                <Labeled label={t('Top_P *')} content={
                  <ValuedSlider value={selectedConfig.apiParameters.topP} min={0} max={1} step={0.1} input
                                onChange={(e, data) => {
                                  setSelectedConfigApiParams({
                                    topP: data.value
                                  });
                                }}/>
                }/>
                <Labeled label={t('Presence Penalty *')} content={
                  <ValuedSlider value={selectedConfig.apiParameters.presencePenalty} min={-2} max={2} step={0.1} input
                                onChange={(e, data) => {
                                  setSelectedConfigApiParams({
                                    presencePenalty: data.value
                                  });
                                }}/>
                }/>
                <Labeled label={t('Frequency Penalty *')} content={
                  <ValuedSlider value={selectedConfig.apiParameters.frequencyPenalty} min={-2} max={2} step={0.1} input
                                onChange={(e, data) => {
                                  setSelectedConfigApiParams({
                                    frequencyPenalty: data.value
                                  });
                                }}/>
                }/>
              </div>
            }
          />
          <Section
            title={t('Model Parameters')}
            content={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Labeled label={t('Model')} content={
                  <div className="flex gap-2 grow">
                    <Select style={{minWidth: 0}} className="grow"
                            value={selectedConfig.modelParameters.modelName}
                            onChange={(e, data) => {
                              setSelectedConfigModelParams({
                                modelName: data.value
                              });
                            }}>
                      {commonStore.modelSourceList.map((modelItem, index) =>
                        modelItem.isLocal && <option key={index} value={modelItem.name}>{modelItem.name}</option>
                      )}
                    </Select>
                    <ToolTipButton desc={t('Manage Models')} icon={<DataUsageSettings20Regular/>} onClick={() => {
                      navigate({pathname: '/models'});
                    }}/>
                  </div>
                }/>
                <ToolTipButton text={t('Convert')} desc={t('Convert model with these configs')} onClick={async () => {
                  const modelPath = `${manifest.localModelDir}/${selectedConfig.modelParameters.modelName}`;
                  if (await FileExists(modelPath)) {
                    const strategy = getStrategy(selectedConfig);
                    const newModelPath = modelPath + '-' + strategy.replace(/[> *+]/g, '-');
                    toast(t('Start Converting'), {autoClose: 1000, type: 'info'});
                    ConvertModel(modelPath, strategy, newModelPath).then(() => {
                      toast(`${t('Convert Success')} - ${newModelPath}`, {type: 'success'});
                      refreshLocalModels({models: commonStore.modelSourceList});
                    }).catch(e => {
                      toast(`${t('Convert Failed')} - ${e}`, {type: 'error'});
                    });
                  } else {
                    toast(`${t('Model Not Found')} - ${modelPath}`, {type: 'error'});
                  }
                }}/>
                <Labeled label={t('Device')} content={
                  <Dropdown style={{minWidth: 0}} className="grow" value={selectedConfig.modelParameters.device}
                            selectedOptions={[selectedConfig.modelParameters.device]}
                            onOptionSelect={(_, data) => {
                              if (data.optionText) {
                                setSelectedConfigModelParams({
                                  device: data.optionText as Device
                                });
                              }
                            }}>
                    <Option>CPU</Option>
                    <Option>CUDA</Option>
                  </Dropdown>
                }/>
                <Labeled label={t('Precision')} content={
                  <Dropdown style={{minWidth: 0}} className="grow" value={selectedConfig.modelParameters.precision}
                            selectedOptions={[selectedConfig.modelParameters.precision]}
                            onOptionSelect={(_, data) => {
                              if (data.optionText) {
                                setSelectedConfigModelParams({
                                  precision: data.optionText as Precision
                                });
                              }
                            }}>
                    <Option>fp16</Option>
                    <Option>int8</Option>
                    <Option>fp32</Option>
                  </Dropdown>
                }/>
                <Labeled label={t('Stored Layers')} content={
                  <ValuedSlider value={selectedConfig.modelParameters.storedLayers} min={0}
                                max={selectedConfig.modelParameters.maxStoredLayers} step={1} input
                                onChange={(e, data) => {
                                  setSelectedConfigModelParams({
                                    storedLayers: data.value
                                  });
                                }}/>
                }/>
                <Labeled label={t('Enable High Precision For Last Layer')} content={
                  <Switch checked={selectedConfig.modelParameters.enableHighPrecisionForLastLayer}
                          onChange={(e, data) => {
                            setSelectedConfigModelParams({
                              enableHighPrecisionForLastLayer: data.checked
                            });
                          }}/>
                }/>
              </div>
            }
          />
        </div>
        <div className="flex flex-row-reverse sm:fixed bottom-2 right-2">
          <RunButton onClickRun={onClickSave}/>
        </div>
      </div>
    }/>
  );
});
